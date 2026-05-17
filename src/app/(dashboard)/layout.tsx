'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ToastProvider } from '@/components/ui/toast';
import { ModalProvider } from '@/components/ui/modal';
import { useBarberNotifications } from '@/hooks/useBarberNotifications';
import { HelpDrawer } from '@/components/help-drawer';
import { BarberHelpContent } from '@/components/barber/barber-help-content';

// Help is rendered as a drawer-trigger button at the bottom of the sidebar,
// not as a nav Link — so it's intentionally absent from these arrays.
const fullNavigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: '📊' },
  { name: 'Profile', href: ROUTES.DASHBOARD_PROFILE, icon: '👤' },
  { name: 'Services', href: ROUTES.DASHBOARD_SERVICES, icon: '✂️' },
  { name: 'Service Areas', href: ROUTES.DASHBOARD_SERVICE_AREAS, icon: '📍' },
  { name: 'Portfolio', href: ROUTES.DASHBOARD_PORTFOLIO, icon: '📸' },
  { name: 'Reviews', href: ROUTES.DASHBOARD_REVIEWS, icon: '⭐' },
  { name: 'Requests', href: ROUTES.DASHBOARD_REQUESTS, icon: '📬' },
  { name: 'Subscription', href: ROUTES.DASHBOARD_SUBSCRIPTION, icon: '💳' },
  { name: 'Credentials', href: ROUTES.DASHBOARD_CREDENTIALS, icon: '🪪' },
  { name: 'Settings', href: ROUTES.DASHBOARD_SETTINGS, icon: '⚙️' },
];

const onboardingNavigation = [
  { name: 'Profile', href: ROUTES.DASHBOARD_PROFILE, icon: '👤' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileStatus, setProfileStatus] = useState<'loading' | 'complete' | 'incomplete'>('loading');
  const [userData, setUserData] = useState<{ emailVerified?: boolean } | null>(null);
  const [profileData, setProfileData] = useState<{ verificationStatus?: string; licenseDocumentUrl?: string | null; verificationNotes?: string | null } | null>(null);

  // Global "?" shortcut to toggle help — skip when typing in inputs/textareas
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '?') return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      e.preventDefault();
      setHelpOpen((open) => !open);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkProfile() {
      try {
        const [profileRes, meRes] = await Promise.all([
          fetch('/api/barbers/profile', { credentials: 'include' }),
          fetch('/api/auth/me', { credentials: 'include' }),
        ]);
        if (cancelled) return;

        if (profileRes.ok) {
          const profData = await profileRes.json();
          setProfileData(profData.data?.barberProfile || profData.barberProfile || null);
          setProfileStatus('complete');
        } else {
          setProfileStatus('incomplete');
        }

        if (meRes.ok) {
          const meData = await meRes.json();
          setUserData(meData.data?.user || meData.user || null);
        }
      } catch {
        if (!cancelled) setProfileStatus('incomplete');
      }
    }
    checkProfile();
    return () => { cancelled = true; };
  }, []);

  const { hasActionRequired } = useBarberNotifications(userData, profileData);

  const isSuspended = profileData?.verificationStatus === 'suspended';
  const isOnboarding = profileStatus === 'incomplete';
  const isLoadingProfile = profileStatus === 'loading';
  const isProfilePage = pathname === ROUTES.DASHBOARD_PROFILE;
  const baseNavigation = isOnboarding ? onboardingNavigation : fullNavigation;
  const navigation = isSuspended
    ? [...baseNavigation, { name: 'Appeal', href: ROUTES.DASHBOARD_APPEAL, icon: '📋' }]
    : baseNavigation;
  const showOnboardingPrompt = isOnboarding && !isProfilePage;

  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex min-h-[calc(100vh-4rem)]">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed bottom-4 right-4 z-40 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 z-30 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar — flex column with viewport-height constraint so the Help
              button always stays in view (mirrors the admin sidebar pattern). */}
          <aside
            className={cn(
              'fixed lg:sticky z-30 top-16 bottom-0 lg:bottom-auto lg:h-[calc(100vh-4rem)] w-64 border-r bg-background lg:bg-muted/10 transition-transform duration-200 flex flex-col',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}
          >
            <div className="flex-1 p-6 overflow-y-auto">
              <h2 className="text-lg font-semibold text-primary mb-4">
                {isLoadingProfile ? ' ' : isOnboarding ? 'Getting Started' : 'Barber Dashboard'}
              </h2>
              {isLoadingProfile ? (
                // Skeleton — avoid flashing the wrong nav (full vs onboarding) before
                // we know if the barber has a profile.
                <nav className="space-y-1" aria-busy="true" aria-label="Loading navigation">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-9 rounded-md bg-muted/40 animate-pulse"
                      style={{ width: `${70 + (i % 3) * 10}%` }}
                    />
                  ))}
                </nav>
              ) : (
                <nav className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-primary'
                        )}
                      >
                        <span className="text-lg">{item.icon}</span>
                        {item.name}
                        {item.href === ROUTES.DASHBOARD && hasActionRequired && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-destructive shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Help — pinned at the bottom of the sidebar; opens the drawer.
                Mirrors the admin-side pattern. */}
            <div className="px-6 py-4 border-t border-border/50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setHelpOpen(true);
                  setSidebarOpen(false);
                }}
                title="Open help (press ?)"
                aria-label="Open help"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground/80 hover:bg-muted hover:text-primary transition-colors"
              >
                <span className="text-lg">❓</span>
                Help
                <kbd className="ml-auto text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border">
                  ?
                </kbd>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
            {showOnboardingPrompt ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-lg w-full">
                  <CardContent className="py-12 text-center">
                    <div className="text-5xl mb-4">👋</div>
                    <h1 className="text-2xl font-bold text-primary mb-2">Welcome! Let&apos;s set up your profile</h1>
                    <p className="text-muted-foreground mb-6">
                      Complete your barber profile to unlock the full dashboard — add services, upload portfolio photos, manage subscriptions, and more.
                    </p>
                    <Link href={ROUTES.DASHBOARD_PROFILE}>
                      <Button size="lg">Set Up Profile</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ) : (
              children
            )}
          </main>

          {/* Help drawer — sibling of main so opening it pushes content rather
              than overlaying (at ≥1100px). Below that it's a centered modal. */}
          <HelpDrawer
            open={helpOpen}
            onClose={() => setHelpOpen(false)}
            title="Barber Help"
            subtitle="Reference for verification, billing, and your dashboard"
          >
            <BarberHelpContent />
          </HelpDrawer>
        </div>
      </ModalProvider>
    </ToastProvider>
  );
}

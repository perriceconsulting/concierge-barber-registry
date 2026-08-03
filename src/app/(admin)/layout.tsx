'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/toast';
import { ModalProvider } from '@/components/ui/modal';
import { HelpDrawer } from '@/components/help-drawer';
import { AdminHelpContent } from '@/components/admin/admin-help-content';

const navigation = [
  { name: 'Dashboard', href: ROUTES.ADMIN, icon: '📊' },
  { name: 'Barbers', href: ROUTES.ADMIN_BARBERS, icon: '✂️' },
  { name: 'Import', href: ROUTES.ADMIN_IMPORT, icon: '📥' },
  { name: 'Outreach', href: ROUTES.ADMIN_OUTREACH, icon: '📨' },
  { name: 'Removal Requests', href: ROUTES.ADMIN_REMOVAL_REQUESTS, icon: '🗑️' },
  { name: 'Appeals', href: ROUTES.ADMIN_APPEALS, icon: '📝' },
  { name: 'Users', href: ROUTES.ADMIN_USERS, icon: '👥' },
  { name: 'Reviews', href: ROUTES.ADMIN_REVIEWS, icon: '⭐' },
  { name: 'Specialties', href: ROUTES.ADMIN_SPECIALTIES, icon: '🎯' },
  { name: 'Social Posts', href: ROUTES.ADMIN_SOCIAL, icon: '📱' },
  { name: 'Blog', href: ROUTES.ADMIN_BLOG, icon: '📰' },
  { name: 'Audit Log', href: ROUTES.ADMIN_AUDIT_LOG, icon: '📋' },
  { name: 'Referrals', href: ROUTES.ADMIN_REFERRALS, icon: '💸' },
  { name: 'Black Label', href: ROUTES.ADMIN_BLACK_LABEL_LEADS, icon: '🖤' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  // Global "?" shortcut to toggle help — skip when typing in inputs/textareas/contenteditable
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

  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex min-h-[calc(100vh-4rem)]">
          {/* Sidebar — icon-rail by default; expands to labeled nav at xl (≥1280px).
              Sticky to viewport; nav scrolls internally so Help stays pinned. */}
          <aside className="w-16 xl:w-64 border-r bg-destructive/5 flex flex-col px-2 xl:px-6 py-6 sticky top-16 h-[calc(100vh-4rem)] transition-[width] duration-200">
            <h2 className="text-lg font-semibold text-destructive mb-4 shrink-0 hidden xl:block">
              Admin Panel
            </h2>
            <nav className="space-y-1 flex-1 overflow-y-auto -mr-2 pr-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={item.name}
                    aria-label={item.name}
                    className={cn(
                      'flex items-center justify-center xl:justify-start gap-3 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-destructive text-destructive-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-destructive'
                    )}
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <span className="hidden xl:inline truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Help — pinned at the bottom of the sidebar, never scrolls out of view. */}
            <div className="mt-4 pt-4 border-t border-border/50 shrink-0">
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                title="Open admin help (press ?)"
                aria-label="Open admin help"
                className="w-full flex items-center justify-center xl:justify-start gap-3 px-2 xl:px-3 py-2 rounded-md text-sm font-medium text-muted-foreground/80 hover:bg-muted hover:text-primary transition-colors"
              >
                <span className="text-lg shrink-0">❓</span>
                <span className="hidden xl:inline">Help</span>
                <kbd className="hidden xl:inline-block ml-auto text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border">
                  ?
                </kbd>
              </button>
            </div>
          </aside>

          {/* Main Content — shrinks when the help drawer is open */}
          <main className="flex-1 p-8 min-w-0">
            {children}
          </main>

          {/* Help drawer — sibling of main so opening it pushes content rather
              than overlaying. Lives inside the same flex row as the sidebar. */}
          <HelpDrawer
            open={helpOpen}
            onClose={() => setHelpOpen(false)}
            title="Admin Help"
            subtitle="Reference for verification, billing, and admin actions"
          >
            <AdminHelpContent />
          </HelpDrawer>
        </div>
      </ModalProvider>
    </ToastProvider>
  );
}

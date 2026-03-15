'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/toast';
import { ModalProvider } from '@/components/ui/modal';

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: '📊' },
  { name: 'Profile', href: ROUTES.DASHBOARD_PROFILE, icon: '👤' },
  { name: 'Services', href: ROUTES.DASHBOARD_SERVICES, icon: '✂️' },
  { name: 'Portfolio', href: ROUTES.DASHBOARD_PORTFOLIO, icon: '📸' },
  { name: 'Reviews', href: ROUTES.DASHBOARD_REVIEWS, icon: '⭐' },
  { name: 'Requests', href: ROUTES.DASHBOARD_REQUESTS, icon: '📬' },
  { name: 'Hours', href: ROUTES.DASHBOARD_HOURS, icon: '🕐' },
  { name: 'Settings', href: ROUTES.DASHBOARD_SETTINGS, icon: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/10">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Barber Dashboard</h2>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-primary'
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
      </ModalProvider>
    </ToastProvider>
  );
}

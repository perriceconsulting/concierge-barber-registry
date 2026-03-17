'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/toast';
import { ModalProvider } from '@/components/ui/modal';

const navigation = [
  { name: 'Dashboard', href: ROUTES.ADMIN, icon: '📊' },
  { name: 'Barbers', href: ROUTES.ADMIN_BARBERS, icon: '✂️' },
  { name: 'Appeals', href: ROUTES.ADMIN_APPEALS, icon: '📝' },
  { name: 'Users', href: ROUTES.ADMIN_USERS, icon: '👥' },
  { name: 'Reviews', href: ROUTES.ADMIN_REVIEWS, icon: '⭐' },
  { name: 'Specialties', href: ROUTES.ADMIN_SPECIALTIES, icon: '🎯' },
  { name: 'Social Posts', href: ROUTES.ADMIN_SOCIAL, icon: '📱' },
  { name: 'Audit Log', href: ROUTES.ADMIN_AUDIT_LOG, icon: '📋' },
];

export default function AdminLayout({
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
          <aside className="w-64 border-r bg-destructive/5">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-destructive mb-4">Admin Panel</h2>
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
                          ? 'bg-destructive text-destructive-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-destructive'
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

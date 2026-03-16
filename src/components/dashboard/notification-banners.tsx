'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useBarberNotifications, BarberNotification } from '@/hooks/useBarberNotifications';

interface NotificationBannersProps {
  user: { emailVerified?: boolean } | null;
  profile: {
    verificationStatus?: string;
    licenseDocumentUrl?: string | null;
    verificationNotes?: string | null;
  } | null;
}

const severityStyles: Record<string, { container: string; icon: string }> = {
  error: {
    container: 'bg-destructive/10 border-destructive text-destructive',
    icon: '!!',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    icon: '!',
  },
  info: {
    container: 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    icon: 'i',
  },
  success: {
    container: 'bg-green-50 border-green-400 text-green-800 dark:bg-green-900/20 dark:text-green-200',
    icon: '\u2713',
  },
};

function NotificationBanner({
  notification,
  onDismiss,
}: {
  notification: BarberNotification;
  onDismiss: (id: string) => void;
}) {
  const styles = severityStyles[notification.severity] || severityStyles.info;

  return (
    <div className={`border-l-4 px-4 py-3 rounded-r-md ${styles.container}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="font-bold text-sm mt-0.5 shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center">
            {styles.icon}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{notification.title}</p>
            <p className="text-sm opacity-90 mt-0.5">{notification.description}</p>
            {notification.actionLabel && notification.actionHref && (
              <Link href={notification.actionHref} className="inline-block mt-2">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  {notification.actionLabel}
                </Button>
              </Link>
            )}
          </div>
        </div>
        {notification.dismissible && (
          <button
            onClick={() => onDismiss(notification.id)}
            className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotificationBanners({ user, profile }: NotificationBannersProps) {
  const { notifications, dismiss } = useBarberNotifications(user, profile);

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <NotificationBanner
          key={notification.id}
          notification={notification}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}

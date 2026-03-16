'use client';

import { useState, useEffect, useMemo } from 'react';
import { ROUTES } from '@/config';

type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface BarberNotification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  dismissible: boolean;
}

interface UserData {
  emailVerified?: boolean;
}

interface ProfileData {
  verificationStatus?: string;
  licenseDocumentUrl?: string | null;
  verificationNotes?: string | null;
}

function deriveNotifications(user: UserData | null, profile: ProfileData | null): BarberNotification[] {
  if (!user || !profile) return [];

  const notifications: BarberNotification[] = [];

  if (!user.emailVerified) {
    notifications.push({
      id: 'email-not-verified',
      severity: 'warning',
      title: 'Verify your email',
      description: 'Please verify your email address to complete your account setup.',
      actionLabel: 'Go to Settings',
      actionHref: ROUTES.DASHBOARD_SETTINGS,
      dismissible: false,
    });
  }

  if (profile.verificationStatus === 'suspended') {
    notifications.push({
      id: 'profile-suspended',
      severity: 'error',
      title: 'Account suspended',
      description: 'Your barber profile has been suspended. Your profile is no longer visible to clients.',
      actionLabel: 'Contact Support',
      actionHref: ROUTES.CONTACT,
      dismissible: false,
    });
  }

  if (profile.verificationStatus === 'rejected') {
    notifications.push({
      id: 'profile-rejected',
      severity: 'error',
      title: 'Profile not approved',
      description: profile.verificationNotes
        ? `Reason: ${profile.verificationNotes}`
        : 'Your profile was not approved. Please update your information and resubmit.',
      actionLabel: 'Update Profile',
      actionHref: ROUTES.DASHBOARD_PROFILE,
      dismissible: false,
    });
  }

  if (!profile.licenseDocumentUrl && profile.verificationStatus !== 'suspended') {
    notifications.push({
      id: 'license-missing',
      severity: 'warning',
      title: 'License document required',
      description: 'Upload your barber license document so your profile can be reviewed and approved.',
      actionLabel: 'Upload License',
      actionHref: ROUTES.DASHBOARD_PROFILE,
      dismissible: false,
    });
  }

  if (profile.verificationStatus === 'pending' && profile.licenseDocumentUrl) {
    notifications.push({
      id: 'profile-pending',
      severity: 'info',
      title: 'Profile under review',
      description: 'Your profile is being reviewed by our team. This typically takes 24-48 hours.',
      dismissible: false,
    });
  }

  if (profile.verificationStatus === 'approved') {
    notifications.push({
      id: 'profile-approved',
      severity: 'success',
      title: 'Profile is live!',
      description: 'Your verified profile is now visible to clients searching for barbers in your area.',
      dismissible: true,
    });
  }

  return notifications;
}

function getInitialDismissedIds(): Set<string> {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dismissed-notifications');
      if (stored) return new Set(JSON.parse(stored));
    }
  } catch {
    // localStorage unavailable
  }
  return new Set();
}

export function useBarberNotifications(user: UserData | null, profile: ProfileData | null) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(getInitialDismissedIds);

  const allNotifications = useMemo(() => deriveNotifications(user, profile), [user, profile]);

  const notifications = useMemo(
    () => allNotifications.filter((n) => !dismissedIds.has(n.id)),
    [allNotifications, dismissedIds]
  );

  const hasActionRequired = useMemo(
    () => allNotifications.some((n) => (n.severity === 'warning' || n.severity === 'error')),
    [allNotifications]
  );

  const dismiss = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('dismissed-notifications', JSON.stringify([...next]));
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  };

  return { notifications, hasActionRequired, dismiss };
}

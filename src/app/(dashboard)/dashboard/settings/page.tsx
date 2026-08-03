'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useModal } from '@/components/ui/modal';
import { secureFetch, clearCsrfToken } from '@/lib/csrf-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SETTINGS');

export default function SettingsPage() {
  const { showToast } = useToast();
  const { showConfirm, showPrompt } = useModal();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [accountData, setAccountData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [preferences, setPreferences] = useState({
    notifyEmailEnabled: true,
    notifyContactRequests: true,
    notifyNewReviews: true,
    notifyMarketingEmails: false,
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [profileData, setProfileData] = useState<{ vacationMode?: boolean } | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchPreferences();
    // Fetch barber profile for vacation mode
    fetch('/api/barbers/profile', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.data?.barberProfile) setProfileData(d.data.barberProfile); })
      .catch(() => {});
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const user = data.data.user;
        setAccountData({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || '',
        });
        setEmailVerified(user.emailVerified);
      }
    } catch (error) {
      logger.error('Failed to fetch user data:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPreferences(data.data.preferences);
      }
    } catch (error) {
      logger.error('Failed to fetch preferences:', error);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      const response = await secureFetch('/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast({
          title: 'Success',
          description: 'Notification preferences saved successfully',
          variant: 'success',
        });
      } else {
        throw new Error(data.message || 'Failed to save preferences');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      showToast({
        title: 'Error',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'error',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await secureFetch('/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast({
          title: 'Success',
          description: data.message,
          variant: 'success',
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      showToast({
        title: 'Error',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      const response = await secureFetch('/api/user/deactivate', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast({
          title: 'Account Deactivated',
          description: data.message,
          variant: 'success',
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          clearCsrfToken();
          window.location.href = '/login';
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to deactivate account');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      showToast({
        title: 'Error',
        description: message,
        variant: 'error',
      });
    }
  };

  const handleDeleteAccount = async (confirmation: string) => {
    try {
      const response = await secureFetch('/api/user/delete', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast({
          title: 'Account Deleted',
          description: 'Your account has been permanently deleted',
          variant: 'success',
        });
        // Redirect to home after 2 seconds
        setTimeout(() => {
          clearCsrfToken();
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to delete account');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      showToast({
        title: 'Error',
        description: message,
        variant: 'error',
      });
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      const response = await secureFetch('/api/auth/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast({
          title: 'Verification Email Sent',
          description: data.data.message,
          variant: 'success',
        });
      } else {
        throw new Error(data.message || 'Failed to send verification email');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      showToast({
        title: 'Error',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-heading">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>View your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2">
                <p className="font-medium">{accountData.email}</p>
                {emailVerified ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Verified</span>
                ) : (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Unverified</span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{accountData.phone}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">First Name</Label>
              <p className="font-medium">{accountData.firstName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Name</Label>
              <p className="font-medium">{accountData.lastName}</p>
            </div>
          </div>

          {!emailVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Email Not Verified</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please verify your email address to access all features. Check your inbox for the verification email.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                >
                  {isResendingVerification ? 'Sending...' : 'Resend Email'}
                </Button>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            To update your account information, please contact support.
          </p>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                disabled={isChangingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={8}
                disabled={isChangingPassword}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                disabled={isChangingPassword}
              />
            </div>

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingPreferences ? (
            <p className="text-muted-foreground">Loading preferences...</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about new reviews and contact requests
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifyEmailEnabled}
                  onChange={(e) => setPreferences({ ...preferences, notifyEmailEnabled: e.target.checked })}
                  className="rounded"
                  disabled={isSavingPreferences}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>New Contact Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when clients send contact requests
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifyContactRequests}
                  onChange={(e) => setPreferences({ ...preferences, notifyContactRequests: e.target.checked })}
                  className="rounded"
                  disabled={isSavingPreferences}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>New Reviews</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you receive new reviews
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifyNewReviews}
                  onChange={(e) => setPreferences({ ...preferences, notifyNewReviews: e.target.checked })}
                  className="rounded"
                  disabled={isSavingPreferences}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive tips, updates, and promotional content
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifyMarketingEmails}
                  onChange={(e) => setPreferences({ ...preferences, notifyMarketingEmails: e.target.checked })}
                  className="rounded"
                  disabled={isSavingPreferences}
                />
              </div>

              <Button
                variant="outline"
                onClick={handleSavePreferences}
                disabled={isSavingPreferences}
              >
                {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Vacation Mode</CardTitle>
          <CardDescription>Temporarily hide your profile from search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                When enabled, your profile won&apos;t appear in search results. Your data is preserved — just toggle off when you&apos;re back.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await secureFetch('/api/barbers/profile', {
                    method: 'PUT',
                    body: JSON.stringify({ vacationMode: !profileData?.vacationMode }),
                  });
                  if (res.ok) {
                    showToast({
                      title: profileData?.vacationMode ? 'Welcome Back!' : 'Vacation Mode On',
                      description: profileData?.vacationMode
                        ? 'Your profile is now visible to clients again.'
                        : 'Your profile is hidden from search. Toggle off when you return.',
                      variant: 'success',
                    });
                    // Refresh profile data
                    const updated = await res.json();
                    if (updated.data?.barberProfile) {
                      setProfileData(updated.data.barberProfile);
                    }
                  }
                } catch {
                  showToast({ title: 'Error', description: 'Failed to update', variant: 'error' });
                }
              }}
            >
              {profileData?.vacationMode ? '🏖️ Turn Off' : '🏖️ Turn On'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <Label>Deactivate Account</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily deactivate your account. You can reactivate it anytime.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => showConfirm({
                title: 'Deactivate Account',
                description: 'Are you sure you want to deactivate your account? This action can be reversed by contacting support.',
                confirmText: 'Deactivate',
                variant: 'destructive',
                onConfirm: handleDeactivateAccount,
              })}
            >
              Deactivate
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <Label className="text-destructive">Delete Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => showPrompt({
                title: 'Delete Account',
                description: 'This action is permanent and cannot be undone. All your data will be permanently deleted.',
                expectedValue: 'DELETE',
                confirmText: 'Delete Account',
                variant: 'destructive',
                onConfirm: handleDeleteAccount,
              })}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

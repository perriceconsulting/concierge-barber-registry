'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function SettingsPage() {
  const { showToast } = useToast();

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

  useEffect(() => {
    fetchUserData();
    fetchPreferences();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPreferences(data.data.preferences);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to save preferences',
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
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!confirm('Are you sure you want to deactivate your account? This action can be reversed by contacting support.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/deactivate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to deactivate account');
      }
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to deactivate account',
        variant: 'error',
      });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('This action is permanent and cannot be undone. Type "DELETE" to confirm:');
    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmation: 'DELETE' }),
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
          localStorage.removeItem('accessToken');
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to delete account');
      }
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'error',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-primary">Settings</h1>
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
              <p className="font-medium">{accountData.email}</p>
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
            <Button variant="outline" onClick={handleDeactivateAccount}>
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
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

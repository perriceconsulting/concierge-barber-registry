'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';

interface CreatedProfile {
  slug: string;
  displayName: string;
  city: string;
  state: string;
  claimUrl: string;
  publicUrl: string;
  invitationStatus: 'sent' | 'no_email' | 'failed';
}

const initialForm = {
  firstName: '',
  lastName: '',
  displayName: '',
  city: '',
  state: '',
  zipCode: '',
  outreachEmail: '',
  shopName: '',
  shopAddressLine1: '',
  bio: '',
  phone: '',
  websiteUrl: '',
  instagramHandle: '',
};

export default function AdminImportPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedProfile[]>([]);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await secureFetch('/api/admin/barbers/manual-create', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          displayName: form.displayName || `${form.firstName} ${form.lastName}`.trim(),
          city: form.city,
          state: form.state.toUpperCase(),
          zipCode: form.zipCode,
          outreachEmail: form.outreachEmail || undefined,
          shopName: form.shopName || undefined,
          shopAddressLine1: form.shopAddressLine1 || undefined,
          bio: form.bio || undefined,
          phone: form.phone || undefined,
          websiteUrl: form.websiteUrl || undefined,
          instagramHandle: form.instagramHandle || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create profile');
      }

      const result = data.data;
      setCreated((prev) => [
        {
          slug: result.profile.slug,
          displayName: result.profile.displayName,
          city: result.profile.city,
          state: result.profile.state,
          claimUrl: result.claimUrl,
          publicUrl: result.publicUrl,
          invitationStatus: result.invitationStatus,
        },
        ...prev,
      ]);

      const toastDescription =
        result.invitationStatus === 'sent'
          ? 'Claim invitation emailed to the barber.'
          : result.invitationStatus === 'failed'
          ? 'Profile created, but the email failed to send. Copy the claim link manually.'
          : 'Copy the claim link below to send manually.';

      showToast({
        title: 'Profile created',
        description: toastDescription,
        variant: result.invitationStatus === 'failed' ? 'warning' : 'success',
      });
      setForm(initialForm);
    } catch (err) {
      showToast({
        title: 'Failed to create profile',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({ title: `${label} copied to clipboard`, variant: 'success' });
    } catch {
      showToast({
        title: 'Could not copy',
        description: 'Select and copy manually.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Import Barber Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Manually create an unclaimed barber profile. The profile is publicly visible
          with a clear &ldquo;Claim it&rdquo; CTA. Send the claim link to the barber via
          your outreach channel.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>New Unclaimed Profile</CardTitle>
          <CardDescription>
            Required: name, location. Optional fields fill out the public listing and
            improve credibility before claim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (defaults to First Last)</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={handleChange('displayName')}
                placeholder="e.g., Mike the Barber"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={handleChange('city')}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={handleChange('state')}
                  placeholder="TX"
                  maxLength={2}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP *</Label>
                <Input
                  id="zipCode"
                  value={form.zipCode}
                  onChange={handleChange('zipCode')}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outreachEmail">Outreach Email (for claim invitation)</Label>
              <Input
                id="outreachEmail"
                type="email"
                value={form.outreachEmail}
                onChange={handleChange('outreachEmail')}
                placeholder="If you have it; the magic-link claim still works without"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  value={form.shopName}
                  onChange={handleChange('shopName')}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopAddressLine1">Shop Address (optional)</Label>
              <Input
                id="shopAddressLine1"
                value={form.shopAddressLine1}
                onChange={handleChange('shopAddressLine1')}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={form.websiteUrl}
                  onChange={handleChange('websiteUrl')}
                  placeholder="https://"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramHandle">Instagram (without @)</Label>
                <Input
                  id="instagramHandle"
                  value={form.instagramHandle}
                  onChange={handleChange('instagramHandle')}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={handleChange('bio')}
                rows={3}
                placeholder="Short bio if you have one. Barber can edit after claim."
                disabled={submitting}
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Creating...' : 'Create Unclaimed Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {created.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Created This Session</CardTitle>
            <CardDescription>
              Copy each claim link and send to the barber via your outreach channel.
              Public link is what shows in search results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {created.map((profile) => (
              <div
                key={profile.slug}
                className="rounded-lg border bg-background p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-primary">{profile.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.city}, {profile.state}
                    </div>
                  </div>
                  <span
                    className={
                      'shrink-0 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ' +
                      (profile.invitationStatus === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : profile.invitationStatus === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800')
                    }
                  >
                    {profile.invitationStatus === 'sent'
                      ? '✓ Email sent'
                      : profile.invitationStatus === 'failed'
                      ? '⚠ Email failed'
                      : 'No email — copy link'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={profile.claimUrl}
                      className="text-xs font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(profile.claimUrl, 'Claim link')}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Claim link (send to barber to claim profile)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={profile.publicUrl}
                      className="text-xs font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(profile.publicUrl, 'Public link')}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Public profile URL
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

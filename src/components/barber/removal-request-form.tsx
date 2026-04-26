'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';

interface RemovalRequestFormProps {
  slug: string;
}

export function RemovalRequestForm({ slug }: RemovalRequestFormProps) {
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await secureFetch(
        `/api/profile/${encodeURIComponent(slug)}/removal-request`,
        {
          method: 'POST',
          body: JSON.stringify({
            reason: reason || undefined,
            contactEmail: contactEmail || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Could not submit request');
      }

      setSubmitted(true);
      showToast({
        title: 'Removal request received',
        description: 'We will review and respond shortly.',
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Could not submit',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-3 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-900">
        Thanks. The listing will be reviewed and removed if appropriate.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <div className="space-y-1">
        <Label htmlFor="removal-reason" className="text-xs">
          Reason (optional)
        </Label>
        <Textarea
          id="removal-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="e.g., Not me, or please remove this listing"
          maxLength={2000}
          disabled={submitting}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="removal-email" className="text-xs">
          Your email (optional, for follow-up)
        </Label>
        <Input
          id="removal-email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={submitting}
        />
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Request Removal'}
      </Button>
    </form>
  );
}

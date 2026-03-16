'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';
import { SUSPENSION_REASONS, isAppealable } from '@/lib/suspension';
import type { SuspensionReason, AppealStatus } from '@prisma/client';

interface Appeal {
  id: string;
  reason: SuspensionReason;
  appealText: string;
  status: AppealStatus;
  adminNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

interface AppealData {
  verificationStatus: string;
  suspensionReason: SuspensionReason | null;
  suspendedAt: string | null;
  appeals: Appeal[];
}

export default function AppealPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AppealData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appealText, setAppealText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      setIsLoading(true);
      const response = await secureFetch('/api/barbers/appeals');
      const result = await response.json();

      if (response.ok && result.success) {
        setData(result.data);
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to load appeal information', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (appealText.length < 20) {
      showToast({ title: 'Error', description: 'Appeal must be at least 20 characters', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await secureFetch('/api/barbers/appeals', {
        method: 'POST',
        body: JSON.stringify({ appealText }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast({ title: 'Appeal Submitted', description: result.message, variant: 'success' });
        setAppealText('');
        fetchAppeals();
      } else {
        showToast({ title: 'Error', description: result.message || 'Failed to submit appeal', variant: 'error' });
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to submit appeal. Please try again.', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Appeal Suspension</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!data || data.verificationStatus !== 'suspended') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Appeal Suspension</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Your account is not currently suspended. No action is needed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reason = data.suspensionReason;
  const reasonMeta = reason ? SUSPENSION_REASONS[reason] : null;
  const canAppeal = reason && isAppealable(reason);
  const hasPendingAppeal = data.appeals.some((a) => a.status === 'pending');

  const getStatusBadge = (status: AppealStatus) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending Review</Badge>;
      case 'approved': return <Badge variant="default">Approved</Badge>;
      case 'denied': return <Badge variant="destructive">Denied</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Appeal Suspension</h1>
        <p className="text-muted-foreground mt-2">
          Submit an appeal if you believe your suspension was made in error.
        </p>
      </div>

      {/* Suspension Details */}
      <Card>
        <CardHeader>
          <CardTitle>Suspension Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reasonMeta && (
            <>
              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <p className="font-medium">{reasonMeta.label}</p>
                <p className="text-sm text-muted-foreground">{reasonMeta.description}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Suspended On</Label>
                <p>{data.suspendedAt ? new Date(data.suspendedAt).toLocaleDateString() : 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Eligible for Appeal</Label>
                <p>{canAppeal ? 'Yes' : 'No — this type of suspension is not eligible for appeal'}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Appeal Form */}
      {canAppeal && !hasPendingAppeal && (
        <Card>
          <CardHeader>
            <CardTitle>Submit an Appeal</CardTitle>
            <CardDescription>
              Explain why you believe the suspension should be lifted. Provide any supporting details or context. Our team will review your appeal within 5 business days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appeal-text">Your Appeal</Label>
              <Textarea
                id="appeal-text"
                placeholder="Explain your situation and why the suspension should be reconsidered..."
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {appealText.length}/2000 characters
              </p>
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting || appealText.length < 20}>
              {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasPendingAppeal && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">Your appeal is currently under review.</p>
            <p className="text-sm text-muted-foreground mt-1">
              You will be notified when a decision has been made. This typically takes up to 5 business days.
            </p>
          </CardContent>
        </Card>
      )}

      {!canAppeal && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium text-destructive">This suspension is not eligible for appeal.</p>
            <p className="text-sm text-muted-foreground mt-1">
              If you have questions, please use the <a href="/contact" className="underline text-primary">contact form</a> to reach our support team.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Appeal History */}
      {data.appeals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Appeal History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.appeals.map((appeal) => (
              <div key={appeal.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Submitted {new Date(appeal.createdAt).toLocaleDateString()}
                  </span>
                  {getStatusBadge(appeal.status)}
                </div>
                <p className="text-sm">{appeal.appealText}</p>
                {appeal.adminNotes && (
                  <div className="bg-muted rounded p-3 mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Admin Response:</p>
                    <p className="text-sm">{appeal.adminNotes}</p>
                  </div>
                )}
                {appeal.reviewedAt && (
                  <p className="text-xs text-muted-foreground">
                    Reviewed {new Date(appeal.reviewedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';
import { SUSPENSION_REASONS, isAppealable } from '@/lib/suspension';
import { LicenseUploader } from '@/components/barber/license-uploader';
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
  const [licenseUploaded, setLicenseUploaded] = useState(false);

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
        showToast({
          title: 'Error',
          description: result.error?.message || result.message || 'Failed to submit appeal',
          variant: 'error',
        });
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
  const resolution = reasonMeta?.resolution;

  const getStatusBadge = (status: AppealStatus) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending Review</Badge>;
      case 'approved': return <Badge variant="default">Approved</Badge>;
      case 'denied': return <Badge variant="destructive">Denied</Badge>;
    }
  };

  const getAppealPlaceholder = () => {
    if (!reason) return 'Explain your situation...';
    switch (reason) {
      case 'expired_license':
        return 'I have renewed my barber license and uploaded the updated document above. My new license number is...';
      case 'policy_violation':
        return 'I have reviewed and updated my profile to comply with the terms of service. The specific changes I made include...';
      case 'client_complaints':
        return 'I have reviewed the client feedback and taken the following steps to improve...';
      default:
        return 'Explain your situation and why the suspension should be reconsidered...';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Appeal Suspension</h1>
        <p className="text-muted-foreground mt-2">
          Review the details of your suspension and take the necessary steps to resolve it.
        </p>
      </div>

      {/* Suspension Details */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Suspension Details</CardTitle>
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
                <p className={canAppeal ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                  {canAppeal ? 'Yes — follow the steps below to resolve this' : 'No — this type of suspension is not eligible for appeal'}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Resolution Steps — only show if not already pending */}
      {canAppeal && !hasPendingAppeal && resolution && (
        <>
          {/* Step 1: Reason-specific action */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                <div>
                  <CardTitle>{resolution.heading}</CardTitle>
                  <CardDescription>{resolution.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Expired License: Show file uploader */}
              {resolution.type === 'license_upload' && (
                <div className="space-y-3">
                  <LicenseUploader
                    verificationStatus="suspended"
                    allowWhenSuspended={true}
                    onUploadSuccess={() => {
                      setLicenseUploaded(true);
                      showToast({
                        title: 'License Uploaded',
                        description: 'Your new license has been uploaded. Now submit your appeal below.',
                        variant: 'success',
                      });
                    }}
                    onUploadError={(error) => {
                      showToast({ title: 'Upload Error', description: error, variant: 'error' });
                    }}
                  />
                  {licenseUploaded && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      New license uploaded successfully
                    </div>
                  )}
                </div>
              )}

              {/* Profile/Review navigation */}
              {(resolution.type === 'profile_update' || resolution.type === 'review_response') && resolution.actionHref && (
                <Link href={resolution.actionHref}>
                  <Button variant="outline">
                    {resolution.actionLabel}
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Appeal form */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                <div>
                  <CardTitle>Submit Your Appeal</CardTitle>
                  <CardDescription>
                    Explain the steps you&apos;ve taken to resolve the issue. Our team will review your appeal within 5 business days.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appeal-text">Your Appeal</Label>
                <Textarea
                  id="appeal-text"
                  placeholder={getAppealPlaceholder()}
                  value={appealText}
                  onChange={(e) => setAppealText(e.target.value)}
                  rows={6}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {appealText.length}/2000 characters (minimum 20)
                </p>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || appealText.length < 20}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Pending appeal message */}
      {hasPendingAppeal && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="py-8 text-center">
            <p className="font-medium">Your appeal is currently under review.</p>
            <p className="text-sm text-muted-foreground mt-1">
              You will be notified when a decision has been made. This typically takes up to 5 business days.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Non-appealable suspension */}
      {!canAppeal && resolution && (
        <Card>
          <CardContent className="py-8 space-y-4 text-center">
            <p className="font-medium text-destructive">{resolution.heading}</p>
            <p className="text-sm text-muted-foreground">{resolution.description}</p>
            {resolution.actionHref && (
              <Link href={resolution.actionHref}>
                <Button variant="outline">{resolution.actionLabel}</Button>
              </Link>
            )}
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

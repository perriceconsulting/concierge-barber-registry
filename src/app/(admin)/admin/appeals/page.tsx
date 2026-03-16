'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useModal } from '@/components/ui/modal';
import { secureFetch } from '@/lib/csrf-client';
import { SUSPENSION_REASONS } from '@/lib/suspension';
import type { SuspensionReason } from '@prisma/client';

interface Appeal {
  id: string;
  reason: SuspensionReason;
  appealText: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  barberProfile: {
    id: string;
    displayName: string;
    suspensionReason: SuspensionReason | null;
    suspendedAt: string | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  reviewedBy: {
    firstName: string;
    lastName: string;
  } | null;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'denied';

export default function AdminAppealsPage() {
  const { showToast } = useToast();
  const { showPrompt } = useModal();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchAppeals = useCallback(async () => {
    try {
      const res = await secureFetch(`/api/admin/appeals?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setAppeals(data.data.appeals);
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to load appeals', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    setLoading(true);
    fetchAppeals();
  }, [fetchAppeals]);

  const submitReview = async (appealId: string, status: 'approved' | 'denied', adminNotes?: string) => {
    setProcessing(appealId);
    try {
      const res = await secureFetch(`/api/admin/appeals/${appealId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNotes: adminNotes || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({
          title: 'Success',
          description: data.message,
          variant: 'success',
        });
        fetchAppeals();
      } else {
        showToast({
          title: 'Error',
          description: data.error?.message || 'Failed to process appeal',
          variant: 'error',
        });
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to process appeal', variant: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReview = (appealId: string, status: 'approved' | 'denied') => {
    showPrompt({
      title: status === 'approved' ? 'Approve Appeal' : 'Deny Appeal',
      description: status === 'approved'
        ? 'This will reinstate the barber. Add optional notes:'
        : 'Add optional notes for the denial:',
      placeholder: 'Admin notes (optional)',
      confirmText: status === 'approved' ? 'Approve & Reinstate' : 'Deny Appeal',
      variant: status === 'denied' ? 'destructive' : 'default',
      onConfirm: (notes: string) => submitReview(appealId, status, notes),
    });
  };

  const pendingCount = appeals.filter(a => a.status === 'pending').length;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'All', value: 'all' },
    { label: 'Approved', value: 'approved' },
    { label: 'Denied', value: 'denied' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-destructive">Appeals</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage suspension appeals
          </p>
        </div>
        {pendingCount > 0 && filter === 'pending' && (
          <Badge variant="warning" className="text-lg px-3 py-1">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading appeals...</p>
        </div>
      ) : appeals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No {filter !== 'all' ? filter : ''} appeals found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appeals.map((appeal) => {
            const reasonMeta = SUSPENSION_REASONS[appeal.reason];
            return (
              <Card key={appeal.id} className={appeal.status === 'pending' ? 'border-amber-300' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {appeal.barberProfile.displayName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {appeal.barberProfile.user.firstName} {appeal.barberProfile.user.lastName} &bull; {appeal.barberProfile.user.email}
                      </p>
                    </div>
                    {statusBadge(appeal.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Suspension reason */}
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-sm font-medium">Suspension Reason: {reasonMeta?.label || appeal.reason}</p>
                    {reasonMeta?.description && (
                      <p className="text-xs text-muted-foreground mt-1">{reasonMeta.description}</p>
                    )}
                    {appeal.barberProfile.suspendedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Suspended: {new Date(appeal.barberProfile.suspendedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Appeal text */}
                  <div>
                    <p className="text-sm font-medium mb-1">Appeal Message:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appeal.appealText}</p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Submitted: {new Date(appeal.createdAt).toLocaleDateString()} at {new Date(appeal.createdAt).toLocaleTimeString()}
                  </p>

                  {/* Admin notes if reviewed */}
                  {appeal.adminNotes && (
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-sm font-medium">Admin Notes:</p>
                      <p className="text-sm text-muted-foreground">{appeal.adminNotes}</p>
                      {appeal.reviewedBy && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Reviewed by {appeal.reviewedBy.firstName} {appeal.reviewedBy.lastName}
                          {appeal.reviewedAt && ` on ${new Date(appeal.reviewedAt).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions for pending appeals */}
                  {appeal.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        onClick={() => handleReview(appeal.id, 'approved')}
                        disabled={processing === appeal.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processing === appeal.id ? 'Processing...' : 'Approve & Reinstate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(appeal.id, 'denied')}
                        disabled={processing === appeal.id}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        Deny
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

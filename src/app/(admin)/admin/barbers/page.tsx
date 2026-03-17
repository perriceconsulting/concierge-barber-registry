'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useModal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { secureFetch } from '@/lib/csrf-client';
import { SUSPENSION_REASONS } from '@/lib/suspension';
import type { SuspensionReason } from '@prisma/client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ADMIN_BARBERS');

interface PendingAppeal {
  id: string;
  appealText: string;
  status: string;
  createdAt: string;
}

interface BarberResponse {
  id: string;
  displayName: string;
  slug: string;
  city: string;
  state: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  suspensionReason?: SuspensionReason | null;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpirationDate?: string;
  licenseDocumentUrl?: string;
  submittedForVerificationAt?: string;
  createdAt: string;
  appeals?: PendingAppeal[];
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface Barber {
  id: string;
  displayName: string;
  slug: string;
  email: string;
  city: string;
  state: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  suspensionReason?: SuspensionReason | null;
  pendingAppeal?: PendingAppeal | null;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpirationDate?: string;
  licenseDocumentUrl?: string;
  submittedAt: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function AdminBarbersPage() {
  const { showToast } = useToast();
  const { showConfirm, showPrompt } = useModal();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'appeals'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingLicense, setViewingLicense] = useState<string | null>(null);
  const [suspendDialog, setSuspendDialog] = useState<{ barberId: string; barberName: string } | null>(null);
  const [selectedReason, setSelectedReason] = useState<SuspensionReason | ''>('');
  const [suspendNotes, setSuspendNotes] = useState('');

  useEffect(() => {
    fetchBarbers();
  }, [filter, searchQuery]);

  const fetchBarbers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (filter !== 'all') params.append('status', filter);

      const response = await fetch(`/api/admin/barbers?${params.toString()}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBarbers(data.data.barbers.map((b: BarberResponse) => ({
          id: b.id,
          displayName: b.displayName,
          slug: b.slug,
          email: b.user?.email || '',
          city: b.city,
          state: b.state,
          verificationStatus: b.verificationStatus,
          suspensionReason: b.suspensionReason,
          pendingAppeal: b.appeals?.[0] || null,
          licenseNumber: b.licenseNumber,
          licenseState: b.licenseState,
          licenseExpirationDate: b.licenseExpirationDate,
          licenseDocumentUrl: b.licenseDocumentUrl,
          submittedAt: new Date(b.submittedForVerificationAt || b.createdAt).toLocaleDateString(),
          user: b.user,
        })));
      } else {
        setError(data.message || 'Failed to fetch barbers');
      }
    } catch (err) {
      logger.error('Failed to fetch barbers:', err);
      setError('Failed to load barbers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const appealsCount = barbers.filter(b => b.pendingAppeal).length;

  const filteredBarbers = barbers.filter(barber => {
    const matchesFilter = filter === 'all'
      || (filter === 'appeals' ? !!barber.pendingAppeal : barber.verificationStatus === filter);
    const matchesSearch = searchQuery === '' ||
      barber.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barber.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await secureFetch(`/api/admin/barbers/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          title: 'Success!',
          description: data.message || 'Barber approved successfully!',
          variant: 'success',
        });
        fetchBarbers();
      } else {
        showToast({
          title: 'Error',
          description: data.message || 'Failed to approve barber',
          variant: 'error',
        });
      }
    } catch (err) {
      logger.error('Failed to approve barber:', err);
      showToast({
        title: 'Error',
        description: 'Failed to approve barber. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleReject = async (id: string) => {
    showPrompt({
      title: 'Reject Barber',
      description: 'Enter rejection reason:',
      placeholder: 'Reason for rejection...',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async (reason: string) => {
        try {
          const response = await secureFetch(`/api/admin/barbers/${id}/verify`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'rejected', notes: reason }),
          });

          const data = await response.json();

          if (response.ok) {
            showToast({
              title: 'Success!',
              description: data.message || 'Barber rejected successfully!',
              variant: 'success',
            });
            fetchBarbers();
          } else {
            showToast({
              title: 'Error',
              description: data.message || 'Failed to reject barber',
              variant: 'error',
            });
          }
        } catch (err) {
          logger.error('Failed to reject barber:', err);
          showToast({
            title: 'Error',
            description: 'Failed to reject barber. Please try again.',
            variant: 'error',
          });
        }
      },
    });
  };

  const handleSuspend = (id: string, name: string) => {
    setSelectedReason('');
    setSuspendNotes('');
    setSuspendDialog({ barberId: id, barberName: name });
  };

  const confirmSuspend = async () => {
    if (!suspendDialog || !selectedReason) return;

    try {
      const response = await secureFetch(`/api/admin/barbers/${suspendDialog.barberId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'suspended',
          suspensionReason: selectedReason,
          notes: suspendNotes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          title: 'Success!',
          description: data.message || 'Barber suspended successfully!',
          variant: 'success',
        });
        setSuspendDialog(null);
        fetchBarbers();
      } else {
        showToast({
          title: 'Error',
          description: data.error?.message || data.message || 'Failed to suspend barber',
          variant: 'error',
        });
      }
    } catch (err) {
      logger.error('Failed to suspend barber:', err);
      showToast({
        title: 'Error',
        description: 'Failed to suspend barber. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleReinstate = async (id: string) => {
    showConfirm({
      title: 'Reinstate Barber',
      description: 'This will reinstate the barber\'s profile, making it visible to clients again. They will need to re-subscribe separately.',
      confirmText: 'Reinstate',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await secureFetch(`/api/admin/barbers/${id}/reinstate`, {
            method: 'PATCH',
            body: JSON.stringify({}),
          });

          const data = await response.json();

          if (response.ok) {
            showToast({
              title: 'Success!',
              description: data.message || 'Barber reinstated successfully!',
              variant: 'success',
            });
            fetchBarbers();
          } else {
            showToast({
              title: 'Error',
              description: data.message || 'Failed to reinstate barber',
              variant: 'error',
            });
          }
        } catch (err) {
          logger.error('Failed to reinstate barber:', err);
          showToast({
            title: 'Error',
            description: 'Failed to reinstate barber. Please try again.',
            variant: 'error',
          });
        }
      },
    });
  };

  const handleAppealReview = async (appealId: string, status: 'approved' | 'denied') => {
    const action = status === 'approved' ? 'approve' : 'deny';
    showPrompt({
      title: `${status === 'approved' ? 'Approve' : 'Deny'} Appeal`,
      description: `Enter notes for the barber (optional):`,
      placeholder: 'Admin notes...',
      confirmText: status === 'approved' ? 'Approve & Reinstate' : 'Deny Appeal',
      cancelText: 'Cancel',
      variant: status === 'denied' ? 'destructive' : undefined,
      onConfirm: async (notes: string) => {
        try {
          const response = await secureFetch(`/api/admin/appeals/${appealId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, adminNotes: notes || undefined }),
          });

          const data = await response.json();

          if (response.ok) {
            showToast({
              title: 'Success!',
              description: data.message,
              variant: 'success',
            });
            fetchBarbers();
          } else {
            showToast({
              title: 'Error',
              description: data.message || `Failed to ${action} appeal`,
              variant: 'error',
            });
          }
        } catch (err) {
          logger.error(`Failed to ${action} appeal:`, err);
          showToast({
            title: 'Error',
            description: `Failed to ${action} appeal. Please try again.`,
            variant: 'error',
          });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-destructive">Manage Barbers</h1>
          <p className="text-muted-foreground mt-2">Loading barbers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-destructive">Manage Barbers</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage barber profiles
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchBarbers()} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
              >
                Approved
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('rejected')}
              >
                Rejected
              </Button>
              <Button
                variant={filter === 'suspended' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('suspended')}
              >
                Suspended
              </Button>
              <Button
                variant={filter === 'appeals' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('appeals')}
              >
                Appeals {appealsCount > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {appealsCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {filteredBarbers.length} barber{filteredBarbers.length !== 1 ? 's' : ''} found
        </p>

        <div className="space-y-4">
          {filteredBarbers.map((barber) => (
            <Card key={barber.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{barber.displayName}</CardTitle>
                    <CardDescription>
                      {barber.email} • {barber.city}, {barber.state}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted: {barber.submittedAt}
                    </p>

                    {/* License Information */}
                    {(barber.licenseNumber || barber.licenseState) && (
                      <div className="mt-3 space-y-1 text-sm">
                        <p className="font-medium">License Information:</p>
                        {barber.licenseNumber && (
                          <p className="text-muted-foreground">
                            License #: {barber.licenseNumber}
                          </p>
                        )}
                        {barber.licenseState && (
                          <p className="text-muted-foreground">
                            State: {barber.licenseState}
                          </p>
                        )}
                        {barber.licenseExpirationDate && (
                          <p className="text-muted-foreground">
                            Expires: {new Date(barber.licenseExpirationDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(barber.verificationStatus)}>
                    {barber.verificationStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* License Document Status */}
                  {!barber.licenseDocumentUrl && (
                    <p className="text-sm text-muted-foreground italic">No license document uploaded</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap items-center">
                  {barber.verificationStatus === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(barber.id)}
                        disabled={!barber.licenseDocumentUrl}
                        title={!barber.licenseDocumentUrl ? 'License document required before approval' : undefined}
                      >
                        Approve
                      </Button>
                      {!barber.licenseDocumentUrl && (
                        <span className="text-xs text-destructive">License document required</span>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(barber.id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {barber.verificationStatus === 'approved' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleSuspend(barber.id, barber.displayName)}
                    >
                      Suspend
                    </Button>
                  )}
                  {barber.verificationStatus === 'suspended' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleReinstate(barber.id)}
                      >
                        Reinstate
                      </Button>
                      {barber.suspensionReason && (
                        <span className="text-xs text-destructive">
                          Reason: {SUSPENSION_REASONS[barber.suspensionReason].label}
                        </span>
                      )}
                    </>
                  )}
                  {/* Pending Appeal */}
                  {barber.pendingAppeal && (
                    <div className="w-full mt-3 border rounded-lg p-3 bg-amber-50 dark:bg-amber-950/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Appeal Pending</Badge>
                        <span className="text-xs text-muted-foreground">
                          Submitted {new Date(barber.pendingAppeal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{barber.pendingAppeal.appealText}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAppealReview(barber.pendingAppeal!.id, 'approved')}
                        >
                          Approve Appeal
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAppealReview(barber.pendingAppeal!.id, 'denied')}
                        >
                          Deny Appeal
                        </Button>
                      </div>
                    </div>
                  )}
                  {barber.licenseDocumentUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingLicense(barber.licenseDocumentUrl!)}
                    >
                      View License
                    </Button>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredBarbers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No barbers found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Suspension Reason Dialog */}
      {suspendDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSuspendDialog(null)}
        >
          <div
            className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-destructive">Suspend {suspendDialog.barberName}</h3>
            <p className="text-sm text-muted-foreground">
              This will hide the barber&apos;s profile from clients and cancel any active Stripe subscription with a prorated refund.
            </p>

            <div className="space-y-2">
              <Label htmlFor="suspension-reason">Suspension Reason *</Label>
              <select
                id="suspension-reason"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value as SuspensionReason)}
              >
                <option value="">Select a reason...</option>
                {(Object.keys(SUSPENSION_REASONS) as SuspensionReason[]).map((key) => (
                  <option key={key} value={key}>
                    {SUSPENSION_REASONS[key].label} {SUSPENSION_REASONS[key].appealable ? '(appealable)' : '(non-appealable)'}
                  </option>
                ))}
              </select>
              {selectedReason && (
                <p className="text-xs text-muted-foreground">
                  {SUSPENSION_REASONS[selectedReason].description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="suspend-notes">Notes (optional)</Label>
              <textarea
                id="suspend-notes"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                placeholder="Additional details..."
                value={suspendNotes}
                onChange={(e) => setSuspendNotes(e.target.value)}
                maxLength={1000}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSuspendDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmSuspend}
                disabled={!selectedReason}
              >
                Suspend Barber
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* License Document Modal */}
      {viewingLicense && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setViewingLicense(null)}
        >
          <div
            className="relative bg-background rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="font-semibold">License Document</h3>
              <div className="flex gap-2">
                <a href={`${viewingLicense}?download=1`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    Download
                  </Button>
                </a>
                <Button size="sm" variant="outline" onClick={() => setViewingLicense(null)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center" style={{ minHeight: '60vh' }}>
              <img
                src={viewingLicense}
                alt="License document"
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useModal } from '@/components/ui/modal';
import { secureFetch } from '@/lib/csrf-client';
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ADMIN_REFERRALS');

type ReferralStatus = 'pending' | 'approved' | 'paid' | 'disputed' | 'declined';

interface Referral {
  id: string;
  referringBarberId: string;
  performingBarberId: string;
  clientFirstName: string | null;
  clientCity: string | null;
  serviceDescription: string;
  serviceFeeCents: number;
  payoutCents: number;
  platformCutCents: number;
  status: ReferralStatus;
  adminNotes: string | null;
  disputeReason: string | null;
  submittedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  payoutId: string | null;
  referringBarber: { id: string; slug: string; displayName: string; city: string; state: string };
  performingBarber: { id: string; slug: string; displayName: string; city: string; state: string };
}

const STATUS_LABEL: Record<ReferralStatus | 'all', string> = {
  all: 'All',
  pending: 'Pending',
  approved: 'Approved',
  paid: 'Paid',
  disputed: 'Disputed',
  declined: 'Declined',
};

function statusVariant(status: ReferralStatus): 'default' | 'secondary' | 'success' | 'destructive' {
  switch (status) {
    case 'pending':
      return 'default';
    case 'approved':
      return 'secondary';
    case 'paid':
      return 'success';
    case 'disputed':
      return 'destructive';
    case 'declined':
      return 'destructive';
  }
}

function fmtCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ReferralsAdminPage() {
  const { showToast } = useToast();
  const { showPrompt } = useModal();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [statusPayoutCents, setStatusPayoutCents] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<ReferralStatus | 'all'>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/admin/referrals?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setReferrals(data.data.referrals);
        setStatusCounts(data.data.statusCounts || {});
        setStatusPayoutCents(data.data.statusPayoutCents || {});
        setSelectedIds(new Set());
      }
    } catch (err) {
      logger.error('Failed to load referrals', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  useVisibilityRefetch(() => fetchReferrals());

  async function changeStatus(referralId: string, status: 'approved' | 'declined' | 'disputed') {
    try {
      const res = await secureFetch(`/api/admin/referrals/${referralId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ title: 'Updated', description: `Referral ${status}.`, variant: 'success' });
        fetchReferrals();
      } else {
        showToast({
          title: 'Failed',
          description: data?.error?.message || 'Could not update.',
          variant: 'error',
        });
      }
    } catch (err) {
      logger.error('Status change failed', err);
    }
  }

  function addAdminNote(referral: Referral) {
    showPrompt({
      title: 'Admin note',
      description: `On ${referral.performingBarber.displayName} → ${referral.referringBarber.displayName}`,
      placeholder: 'Internal note (not visible to barbers)',
      confirmText: 'Save note',
      cancelText: 'Cancel',
      defaultValue: referral.adminNotes ?? '',
      onConfirm: async (value: string) => {
        try {
          const res = await secureFetch(`/api/admin/referrals/${referral.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ adminNotes: value }),
          });
          if (res.ok) {
            showToast({ title: 'Saved', variant: 'success' });
            fetchReferrals();
          } else {
            const data = await res.json();
            showToast({
              title: 'Failed',
              description: data?.error?.message || 'Could not save.',
              variant: 'error',
            });
          }
        } catch (err) {
          logger.error('Note save failed', err);
        }
      },
    });
  }

  const selectedTotal = useMemo(() => {
    return referrals
      .filter((r) => selectedIds.has(r.id))
      .reduce((sum, r) => sum + r.payoutCents, 0);
  }, [referrals, selectedIds]);

  const selectedCount = selectedIds.size;
  const selectableInView = referrals.filter((r) => r.status === 'approved');

  function toggleId(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function selectAllApproved() {
    setSelectedIds(new Set(selectableInView.map((r) => r.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function runPayoutBatch() {
    if (selectedIds.size === 0) {
      showToast({ title: 'Select referrals first', variant: 'warning' });
      return;
    }
    showPrompt({
      title: `Mark ${selectedCount} referral(s) paid`,
      description: `Total: ${fmtCents(selectedTotal)}. Enter a batch label (e.g. "2026-05") and any notes — this is honor-system; no money is moved.`,
      placeholder: 'Batch label (optional)',
      confirmText: 'Mark Paid',
      cancelText: 'Cancel',
      onConfirm: async (batchRef: string) => {
        try {
          const res = await secureFetch('/api/admin/referrals/payouts', {
            method: 'POST',
            body: JSON.stringify({
              referralIds: Array.from(selectedIds),
              batchRef: batchRef.trim() || undefined,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            showToast({
              title: 'Paid',
              description: data.data.message,
              variant: 'success',
            });
            fetchReferrals();
          } else {
            showToast({
              title: 'Failed',
              description: data?.error?.message || 'Payout failed.',
              variant: 'error',
            });
          }
        } catch (err) {
          logger.error('Payout failed', err);
        }
      },
    });
  }

  function downloadCsv() {
    window.location.href = '/api/admin/referrals/payouts?format=csv';
  }

  const allCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Referral Royalties</h1>
        <p className="text-muted-foreground mt-1">
          Honor-system ledger of cross-barber referrals. Approve to authorize payout, then batch
          monthly. The CSV export is what your bookkeeper actually pays.
        </p>
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(['pending', 'approved', 'paid', 'disputed'] as const).map((s) => (
          <Card key={s}>
            <CardHeader className="pb-2">
              <CardDescription className="uppercase text-xs tracking-wider">
                {STATUS_LABEL[s]}
              </CardDescription>
              <CardTitle className="font-serif text-2xl">
                {fmtCents(statusPayoutCents[s] ?? 0)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {statusCounts[s] ?? 0} referral(s)
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'paid', 'disputed', 'declined'] as const).map((s) => {
          const count = s === 'all' ? allCount : statusCounts[s] ?? 0;
          return (
            <Button
              key={s}
              size="sm"
              variant={filter === s ? 'default' : 'outline'}
              onClick={() => setFilter(s)}
            >
              {STATUS_LABEL[s]}
              <span className="ml-2 text-xs opacity-75">{count}</span>
            </Button>
          );
        })}
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={downloadCsv}>
          Export Payouts CSV
        </Button>
      </div>

      {/* Batch action bar */}
      {filter === 'approved' && selectableInView.length > 0 && (
        <Card className="bg-secondary/5 border-secondary/30">
          <CardContent className="py-4 flex flex-wrap items-center gap-3">
            <div className="text-sm">
              <strong>{selectedCount}</strong> selected · Total{' '}
              <strong>{fmtCents(selectedTotal)}</strong>
            </div>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={selectAllApproved}>
              Select All ({selectableInView.length})
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection} disabled={selectedCount === 0}>
              Clear
            </Button>
            <Button size="sm" onClick={runPayoutBatch} disabled={selectedCount === 0}>
              Mark Paid in Batch
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : referrals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {filter === 'all'
              ? 'No referrals submitted yet. Verified barbers can submit from their dashboard.'
              : `No referrals with status "${STATUS_LABEL[filter]}".`}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {referrals.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {r.status === 'approved' && (
                      <input
                        type="checkbox"
                        className="mt-1.5 h-4 w-4 accent-primary cursor-pointer"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleId(r.id)}
                        aria-label={`Select referral ${r.id}`}
                      />
                    )}
                    <div className="min-w-0">
                      <CardTitle className="font-serif text-lg">
                        {r.performingBarber.displayName}
                        <span className="text-muted-foreground font-sans font-normal text-sm">
                          {' '}
                          performed →{' '}
                        </span>
                        {r.referringBarber.displayName}
                        <span className="text-muted-foreground font-sans font-normal text-sm">
                          {' '}
                          referred
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {r.performingBarber.city}, {r.performingBarber.state}
                        {' → '}
                        {r.referringBarber.city}, {r.referringBarber.state}
                        {' · '}
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={statusVariant(r.status)}>{STATUS_LABEL[r.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Service</p>
                    <p className="mt-1">{fmtCents(r.serviceFeeCents)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Royalty (10%)
                    </p>
                    <p className="mt-1 font-semibold text-primary">{fmtCents(r.payoutCents)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Platform (5%)
                    </p>
                    <p className="mt-1">{fmtCents(r.platformCutCents)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Client</p>
                    <p className="mt-1">
                      {r.clientFirstName ?? '—'}
                      {r.clientCity ? `, ${r.clientCity}` : ''}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Service description
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{r.serviceDescription}</p>
                </div>

                {r.adminNotes && (
                  <div className="rounded-md bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Admin notes
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{r.adminNotes}</p>
                  </div>
                )}

                {r.disputeReason && (
                  <div className="rounded-md bg-destructive/10 p-3">
                    <p className="text-xs uppercase tracking-wider text-destructive mb-1">
                      Dispute
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{r.disputeReason}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
                  {r.status === 'pending' && (
                    <Button size="sm" onClick={() => changeStatus(r.id, 'approved')}>
                      Approve
                    </Button>
                  )}
                  {(r.status === 'pending' || r.status === 'approved') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => changeStatus(r.id, 'declined')}
                    >
                      Decline
                    </Button>
                  )}
                  {r.status !== 'paid' && r.status !== 'disputed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changeStatus(r.id, 'disputed')}
                    >
                      Dispute
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => addAdminNote(r)}>
                    {r.adminNotes ? 'Edit Note' : 'Add Note'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

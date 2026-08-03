'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch';
import { createLogger } from '@/lib/logger';

const logger = createLogger('REFERRAL_CARD');

type Status = 'pending' | 'approved' | 'paid' | 'disputed' | 'declined';

interface BarberRef {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  state: string;
}

interface Referral {
  id: string;
  serviceDescription: string;
  serviceFeeCents: number;
  payoutCents: number;
  status: Status;
  submittedAt: string;
  paidAt: string | null;
  referringBarber?: BarberRef;
  performingBarber?: BarberRef;
}

interface Summary {
  pendingCents: number;
  approvedCents: number;
  paidCents: number;
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusVariant(status: Status): 'default' | 'secondary' | 'success' | 'destructive' {
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

/**
 * Barber dashboard widget — referral royalties.
 *
 * Shows the barber's earnings summary (received side), the most recent
 * referrals, and an inline "submit a referral" form for when *they* perform
 * a service for someone else's traveling client.
 */
export function ReferralCard() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<Summary>({ pendingCents: 0, approvedCents: 0, paidCents: 0 });
  const [received, setReceived] = useState<Referral[]>([]);
  const [performed, setPerformed] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [refSlug, setRefSlug] = useState('');
  const [feeDollars, setFeeDollars] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [clientFirst, setClientFirst] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/referrals/mine', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSummary(data.data.summary);
        setReceived(data.data.received);
        setPerformed(data.data.performed);
      }
    } catch (err) {
      logger.error('Failed to load referrals', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useVisibilityRefetch(() => refetch());

  function resetForm() {
    setRefSlug('');
    setFeeDollars('');
    setServiceDesc('');
    setClientFirst('');
    setClientCity('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!refSlug.trim() || !serviceDesc.trim() || !feeDollars) {
      showToast({ title: 'Missing info', description: 'Slug, service, and fee are required.', variant: 'warning' });
      return;
    }
    const cents = Math.round(parseFloat(feeDollars) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      showToast({ title: 'Invalid fee', variant: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await secureFetch('/api/referrals', {
        method: 'POST',
        body: JSON.stringify({
          referringBarberSlug: refSlug.trim(),
          serviceDescription: serviceDesc.trim(),
          serviceFeeCents: cents,
          clientFirstName: clientFirst.trim() || undefined,
          clientCity: clientCity.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({
          title: 'Referral submitted',
          description: data.data.message,
          variant: 'success',
        });
        resetForm();
        setShowForm(false);
        refetch();
      } else {
        showToast({
          title: 'Failed',
          description: data?.error?.message || 'Could not submit.',
          variant: 'error',
        });
      }
    } catch (err) {
      logger.error('Submit failed', err);
      showToast({ title: 'Failed', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="font-serif">Referral Royalties</CardTitle>
            <CardDescription>
              Earn 10% when your clients travel and use a verified CBR partner. Submit when you
              perform a service for another barber&apos;s traveling client.
            </CardDescription>
          </div>
          <Button size="sm" variant={showForm ? 'outline' : 'default'} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Submit Referral'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary tiles */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</p>
            <p className="font-serif text-xl mt-1">{loading ? '…' : fmt(summary.pendingCents)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Approved</p>
            <p className="font-serif text-xl mt-1 text-secondary">
              {loading ? '…' : fmt(summary.approvedCents)}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid</p>
            <p className="font-serif text-xl mt-1">{loading ? '…' : fmt(summary.paidCents)}</p>
          </div>
        </div>

        {/* Submit form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-3 border border-secondary/30 rounded-md p-4 bg-secondary/5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ref-slug">Home barber profile slug *</Label>
                <Input
                  id="ref-slug"
                  value={refSlug}
                  onChange={(e) => setRefSlug(e.target.value)}
                  placeholder="e.g. juan-rivera-miami"
                />
                <p className="text-[11px] text-muted-foreground">
                  Last segment of their CBR profile URL (e.g. <code>/barbers/juan-rivera-miami</code>).
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ref-fee">Service fee (USD) *</Label>
                <Input
                  id="ref-fee"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="1"
                  value={feeDollars}
                  onChange={(e) => setFeeDollars(e.target.value)}
                  placeholder="120.00"
                />
                {feeDollars && Number.isFinite(parseFloat(feeDollars)) && (
                  <p className="text-[11px] text-secondary">
                    10% royalty = {fmt(Math.round(parseFloat(feeDollars) * 100 * 0.1))}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ref-desc">Service description *</Label>
              <Textarea
                id="ref-desc"
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                placeholder="Hot-towel shave + beard sculpt"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ref-client">Client first name (optional)</Label>
                <Input
                  id="ref-client"
                  value={clientFirst}
                  onChange={(e) => setClientFirst(e.target.value)}
                  placeholder="Marcus"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ref-city">Client home city (optional)</Label>
                <Input
                  id="ref-city"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  placeholder="Miami"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit for Admin Review'}
              </Button>
            </div>
          </form>
        )}

        {/* Recent received */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Recent royalties received</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : received.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No royalties yet. When a verified CBR barber serves one of your traveling clients,
              they&apos;ll submit a referral here.
            </p>
          ) : (
            <ul className="divide-y border rounded-md">
              {received.slice(0, 5).map((r) => (
                <li key={r.id} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate">
                      {r.performingBarber?.displayName ?? '—'}{' '}
                      <span className="text-muted-foreground text-xs">
                        in {r.performingBarber?.city}, {r.performingBarber?.state}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.serviceDescription} · {new Date(r.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-serif text-sm">{fmt(r.payoutCents)}</span>
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent performed (what I owe) */}
        {performed.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Referrals you submitted</h3>
            <ul className="divide-y border rounded-md">
              {performed.slice(0, 5).map((r) => (
                <li key={r.id} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate">
                      → {r.referringBarber?.displayName ?? '—'}{' '}
                      <span className="text-muted-foreground text-xs">
                        in {r.referringBarber?.city}, {r.referringBarber?.state}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.serviceDescription} · {new Date(r.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-muted-foreground text-xs">royalty {fmt(r.payoutCents)}</span>
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

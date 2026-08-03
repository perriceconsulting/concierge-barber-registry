'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';

interface RemovalRequest {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  state: string;
  outreachEmail: string | null;
  claimStatus: 'unclaimed' | 'claim_sent' | 'claimed';
  dataSource: 'self_signup' | 'manual_admin' | 'google_places' | 'state_license';
  removalRequestedAt: string;
}

const SOURCE_LABELS: Record<RemovalRequest['dataSource'], string> = {
  self_signup: 'Self signup',
  manual_admin: 'Manual entry',
  google_places: 'Google Places',
  state_license: 'License board',
};

export default function AdminRemovalRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<RemovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/removal-requests');
      const data = await response.json();
      if (response.ok && data.success) {
        setRequests(data.data.requests);
      } else {
        showToast({
          title: 'Failed to load',
          description: data.error?.message || 'Unknown error',
          variant: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (id: string, action: 'approve' | 'dismiss') => {
    if (action === 'approve' && !confirm('Permanently delete this profile?')) return;
    setActingId(id);

    try {
      const response = await secureFetch(`/api/admin/removal-requests/${id}`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Action failed');
      }

      showToast({
        title:
          action === 'approve'
            ? 'Profile removed'
            : 'Request dismissed',
        variant: 'success',
      });

      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      showToast({
        title: 'Action failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-heading">Removal Requests</h1>
        <p className="mt-2 text-muted-foreground">
          Review and act on barber profile removal requests. Approve to delete the
          profile (and the stub user if applicable). Dismiss to keep the profile and
          clear the request flag.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No pending removal requests.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{r.displayName}</CardTitle>
                    <CardDescription>
                      {r.city}, {r.state} · {SOURCE_LABELS[r.dataSource]} · {r.claimStatus}
                    </CardDescription>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(r.removalRequestedAt).toLocaleString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Outreach email: </span>
                  <span>{r.outreachEmail || '—'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Public URL: </span>
                  <a
                    href={`/barbers/${r.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    /barbers/{r.slug}
                  </a>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={actingId === r.id}
                    onClick={() => handleAction(r.id, 'approve')}
                  >
                    {actingId === r.id ? 'Working...' : 'Approve removal'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actingId === r.id}
                    onClick={() => handleAction(r.id, 'dismiss')}
                  >
                    Dismiss
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

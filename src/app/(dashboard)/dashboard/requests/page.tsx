'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';
import { UpgradeBanner } from '@/components/subscription/upgrade-banner';

interface ContactRequest {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  message: string;
  serviceInterested: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  status: 'new' | 'read' | 'responded' | 'archived';
  createdAt: string;
}

interface Stats {
  total: number;
  new: number;
  read: number;
  responded: number;
  archived: number;
}

type FilterStatus = 'all' | 'new' | 'read' | 'responded' | 'archived';

export default function RequestsPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, read: 0, responded: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [contactLimit, setContactLimit] = useState<number | null>(null);
  const [contactUsage, setContactUsage] = useState(0);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await secureFetch(`/api/barbers/requests?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data.requests);
        setStats(data.data.stats);
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to load requests', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    let cancelled = false;
    async function fetchContactLimits() {
      try {
        const response = await fetch('/api/barbers/subscription', { credentials: 'include' });
        if (response.ok && !cancelled) {
          const data = await response.json();
          if (data.success) {
            setContactLimit(data.data.usage.contactRequests.limit);
            setContactUsage(data.data.usage.contactRequests.current);
          }
        }
      } catch {
        // Fall back to no limit display
      }
    }
    fetchContactLimits();
    return () => { cancelled = true; };
  }, []);

  const updateStatus = async (id: string, status: 'read' | 'responded' | 'archived') => {
    setProcessing(id);
    try {
      const res = await secureFetch(`/api/barbers/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
      } else {
        showToast({ title: 'Error', description: data.error?.message || 'Update failed', variant: 'error' });
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to update request', variant: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning'; label: string }> = {
      new: { variant: 'warning', label: 'New' },
      read: { variant: 'secondary', label: 'Read' },
      responded: { variant: 'success', label: 'Responded' },
      archived: { variant: 'outline', label: 'Archived' },
    };
    const c = config[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const filters: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'All', value: 'all', count: stats.total },
    { label: 'New', value: 'new', count: stats.new },
    { label: 'Read', value: 'read', count: stats.read },
    { label: 'Responded', value: 'responded', count: stats.responded },
    { label: 'Archived', value: 'archived', count: stats.archived },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Contact Requests</h1>
        <p className="text-muted-foreground mt-2">
          Manage client inquiries and booking requests
        </p>
      </div>

      {contactLimit !== null && contactUsage >= contactLimit && (
        <UpgradeBanner
          feature="contact requests this month"
          currentUsage={contactUsage}
          limit={contactLimit}
        />
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{stats.new}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Read</CardDescription>
            <CardTitle className="text-3xl">{stats.read}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Responded</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.responded}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Archived</CardDescription>
            <CardTitle className="text-3xl">{stats.archived}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label} ({f.count})
          </Button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {filter === 'all'
                ? 'No contact requests yet. They will appear here when clients reach out through your profile.'
                : `No ${filter} requests`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className={req.status === 'new' ? 'border-amber-300' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{req.clientName}</CardTitle>
                      {getStatusBadge(req.status)}
                    </div>
                    <CardDescription>
                      {req.clientEmail}
                      {req.clientPhone && ` \u2022 ${req.clientPhone}`}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Details */}
                {(req.serviceInterested || req.preferredDate || req.preferredTime) && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {req.serviceInterested && (
                      <div>
                        <span className="text-muted-foreground">Service:</span>{' '}
                        <span className="font-medium">{req.serviceInterested}</span>
                      </div>
                    )}
                    {req.preferredDate && (
                      <div>
                        <span className="text-muted-foreground">Preferred Date:</span>{' '}
                        <span className="font-medium">{new Date(req.preferredDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {req.preferredTime && (
                      <div>
                        <span className="text-muted-foreground">Preferred Time:</span>{' '}
                        <span className="font-medium">{req.preferredTime}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Message */}
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{req.message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {req.status === 'new' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(req.id, 'read')}
                      disabled={processing === req.id}
                    >
                      Mark as Read
                    </Button>
                  )}
                  {(req.status === 'new' || req.status === 'read') && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(req.id, 'responded')}
                      disabled={processing === req.id}
                    >
                      Mark as Responded
                    </Button>
                  )}
                  {req.status !== 'archived' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(req.id, 'archived')}
                      disabled={processing === req.id}
                    >
                      Archive
                    </Button>
                  )}
                  {/* Reply via email link */}
                  <a
                    href={`mailto:${req.clientEmail}?subject=Re: Your inquiry on Concierge Barber Registry`}
                    className="inline-flex items-center gap-1"
                  >
                    <Button size="sm" variant="outline">
                      Reply via Email
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

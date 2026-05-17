'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useModal } from '@/components/ui/modal';
import { secureFetch } from '@/lib/csrf-client';
import { useVisibilityRefetch } from '@/hooks/useVisibilityRefetch';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ADMIN_BL_LEADS');

type LeadStatus = 'new' | 'contacted' | 'converted' | 'declined';

interface Lead {
  id: string;
  fullName: string;
  email: string;
  city: string | null;
  source: string | null;
  notes: string | null;
  status: LeadStatus;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<LeadStatus | 'all', string> = {
  all: 'All',
  new: 'New',
  contacted: 'Contacted',
  converted: 'Converted',
  declined: 'Declined',
};

function statusVariant(status: LeadStatus): 'default' | 'secondary' | 'success' | 'destructive' {
  switch (status) {
    case 'new':
      return 'default';
    case 'contacted':
      return 'secondary';
    case 'converted':
      return 'success';
    case 'declined':
      return 'destructive';
  }
}

export default function BlackLabelLeadsPage() {
  const { showToast } = useToast();
  const { showPrompt } = useModal();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/admin/black-label-leads?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.data.leads);
        setStatusCounts(data.data.statusCounts || {});
      }
    } catch (err) {
      logger.error('Failed to load Black Label leads', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useVisibilityRefetch(() => fetchLeads());

  async function changeStatus(leadId: string, status: LeadStatus) {
    try {
      const res = await secureFetch(`/api/admin/black-label-leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({
          title: 'Updated',
          description: `Lead marked ${status}.`,
          variant: 'success',
        });
        fetchLeads();
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

  function addAdminNote(lead: Lead) {
    showPrompt({
      title: 'Add admin note',
      description: `For ${lead.fullName} (${lead.email})`,
      placeholder: 'Internal note (not visible to applicant)',
      confirmText: 'Save note',
      cancelText: 'Cancel',
      defaultValue: lead.adminNotes ?? '',
      onConfirm: async (value: string) => {
        try {
          const res = await secureFetch(`/api/admin/black-label-leads/${lead.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ adminNotes: value }),
          });
          if (res.ok) {
            showToast({ title: 'Saved', variant: 'success' });
            fetchLeads();
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

  const filtered = leads;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Black Label Leads</h1>
        <p className="text-muted-foreground mt-1">
          Membership requests submitted via the public waitlist form.
        </p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'new', 'contacted', 'converted', 'declined'] as const).map((s) => {
          const count = s === 'all'
            ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
            : (statusCounts[s] ?? 0);
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
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {filter === 'all'
              ? 'No Black Label leads yet. The public waitlist form posts here.'
              : `No leads with status "${STATUS_LABEL[filter]}".`}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((lead) => (
            <Card key={lead.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="font-serif">{lead.fullName}</CardTitle>
                    <CardDescription>
                      <a href={`mailto:${lead.email}`} className="text-secondary hover:underline">
                        {lead.email}
                      </a>
                      {lead.city && <> &middot; {lead.city}</>}
                      <> &middot; {new Date(lead.createdAt).toLocaleDateString()}</>
                    </CardDescription>
                  </div>
                  <Badge variant={statusVariant(lead.status)}>{STATUS_LABEL[lead.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {lead.source && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Source</p>
                    <p className="text-sm">{lead.source}</p>
                  </div>
                )}
                {lead.notes && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Applicant notes</p>
                    <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}
                {lead.adminNotes && (
                  <div className="rounded-md bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Admin notes</p>
                    <p className="text-sm whitespace-pre-wrap">{lead.adminNotes}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
                  {lead.status !== 'contacted' && (
                    <Button size="sm" variant="outline" onClick={() => changeStatus(lead.id, 'contacted')}>
                      Mark Contacted
                    </Button>
                  )}
                  {lead.status !== 'converted' && (
                    <Button size="sm" onClick={() => changeStatus(lead.id, 'converted')}>
                      Mark Converted
                    </Button>
                  )}
                  {lead.status !== 'declined' && (
                    <Button size="sm" variant="destructive" onClick={() => changeStatus(lead.id, 'declined')}>
                      Decline
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => addAdminNote(lead)}>
                    {lead.adminNotes ? 'Edit Note' : 'Add Note'}
                  </Button>
                </div>

                {lead.status === 'converted' && (
                  <p className="text-xs text-muted-foreground italic">
                    Tip: to grant this applicant Black Label access, find them in{' '}
                    <strong>Users</strong> and change their role to <strong>HNWI</strong>. Conversion
                    is a separate decision from access — keep them explicit.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

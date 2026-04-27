'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';

type OutreachStatus =
  | 'not_contacted'
  | 'messaged_ig'
  | 'messaged_fb'
  | 'messaged_tiktok'
  | 'messaged_email'
  | 'messaged_phone'
  | 'responded'
  | 'not_interested'
  | 'bounced';

interface OutreachProfile {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  state: string;
  shopName: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  outreachEmail: string | null;
  outreachStatus: OutreachStatus;
  outreachUpdatedAt: string | null;
  outreachNotes: string | null;
  claimStatus: 'unclaimed' | 'claim_sent';
  claimToken: string | null;
  dataSource: string;
  user: { firstName: string; lastName: string };
}

const STATUS_LABELS: Record<OutreachStatus, string> = {
  not_contacted: 'Not contacted',
  messaged_ig: 'Messaged IG',
  messaged_fb: 'Messaged FB',
  messaged_tiktok: 'Messaged TikTok',
  messaged_email: 'Emailed',
  messaged_phone: 'Texted/Called',
  responded: 'Responded',
  not_interested: 'Not interested',
  bounced: 'Bounced',
};

const STATUS_BADGE_CLASS: Record<OutreachStatus, string> = {
  not_contacted: 'bg-amber-100 text-amber-800',
  messaged_ig: 'bg-purple-100 text-purple-800',
  messaged_fb: 'bg-blue-100 text-blue-800',
  messaged_tiktok: 'bg-pink-100 text-pink-800',
  messaged_email: 'bg-cyan-100 text-cyan-800',
  messaged_phone: 'bg-emerald-100 text-emerald-800',
  responded: 'bg-green-100 text-green-800',
  not_interested: 'bg-gray-200 text-gray-700',
  bounced: 'bg-red-100 text-red-800',
};

const STATUS_OPTIONS: OutreachStatus[] = [
  'not_contacted',
  'messaged_ig',
  'messaged_fb',
  'messaged_tiktok',
  'messaged_email',
  'messaged_phone',
  'responded',
  'not_interested',
  'bounced',
];

function buildSearchUrl(platform: 'ig' | 'fb' | 'tiktok' | 'google', profile: OutreachProfile) {
  const name = profile.displayName;
  const location = `${profile.city} ${profile.state}`;
  switch (platform) {
    case 'ig':
      // If we already know their handle, jump straight there
      if (profile.instagramHandle) {
        return `https://www.instagram.com/${profile.instagramHandle.replace(/^@/, '')}/`;
      }
      return `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${name}" barber ${profile.city}`)}`;
    case 'fb':
      return `https://www.facebook.com/search/people/?q=${encodeURIComponent(`${name} barber ${location}`)}`;
    case 'tiktok':
      return `https://www.tiktok.com/search?q=${encodeURIComponent(`${name} barber ${profile.city}`)}`;
    case 'google':
      return `https://www.google.com/search?q=${encodeURIComponent(`"${name}" barber ${location}`)}`;
  }
}

// "First names" we get from Google Places splits are often business-word
// fragments like "All Hair Cuts" -> firstName="All". Filter those out so we
// never produce "Hey All".
const NON_PERSON_NAME_TOKENS = new Set([
  'all',
  'the',
  'a',
  'an',
  'mr',
  'mrs',
  'ms',
  'master',
  'salon',
  'studio',
  'shop',
  'hair',
  'cuts',
  'cut',
  'barber',
  'barbers',
  'barbershop',
  'pro',
  'pros',
  'classic',
  'modern',
  'royal',
  'crown',
  'fade',
  'fades',
  'blade',
  'blades',
  'edge',
  'sharp',
]);

function isLikelyPersonName(name: string | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (trimmed.length < 2 || trimmed.length > 20) return false;
  if (/[\s\d]/.test(trimmed)) return false; // multi-word or has digits = not a first name
  return !NON_PERSON_NAME_TOKENS.has(trimmed.toLowerCase());
}

function buildDmTemplate(profile: OutreachProfile): string {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://conciergebarberregistry.com';
  const claimUrl = profile.claimToken
    ? `${baseUrl}/claim/${profile.claimToken}`
    : `${baseUrl}/barbers/${profile.slug}`;

  const businessLabel = profile.shopName || profile.displayName;
  const salutation = isLikelyPersonName(profile.user.firstName)
    ? `Hey ${profile.user.firstName}!`
    : 'Hey there!';

  return `${salutation} I'm Percy from Concierge Barber Registry — local NJ founder.

[Personalize here: 1–2 sentences about something specific to ${businessLabel} — a recent post, a new hire, a style you saw, anything real. Skip if you have nothing genuine to say.]

I'm building a license-verified directory specifically for independent barbers and reserved a profile under ${businessLabel} in ${profile.city}, ${profile.state}. Three things it actually solves:

→ Trust signal that converts: clients see your verified-license badge, your portfolio, and real reviews — not "DM for prices" guessing.

→ No middleman cut: I don't process payments or take a commission. Clients message you direct. You keep 100% of every cut.

→ Findable by specialty: when ${profile.city} clients search "fade barber" or "hot towel shave," your profile surfaces — not just whoever paid for the ad slot.

Free forever on the Starter tier, no credit card. Claim it here: ${claimUrl}

Or tell me to take the listing down — no hard feelings.`;
}

export default function AdminOutreachPage() {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<OutreachProfile[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OutreachStatus | 'all'>('all');
  const [claimFilter, setClaimFilter] = useState<'all' | 'unclaimed' | 'claim_sent'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (claimFilter !== 'all') params.set('claimStatus', claimFilter);

      const response = await fetch(`/api/admin/outreach?${params.toString()}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setProfiles(data.data.profiles);
        setCounts(data.data.counts);
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
  }, [query, statusFilter, claimFilter, showToast]);

  useEffect(() => {
    const t = setTimeout(load, 200); // debounce
    return () => clearTimeout(t);
  }, [load]);

  const updateStatus = async (id: string, outreachStatus: OutreachStatus) => {
    setUpdatingId(id);
    try {
      const response = await secureFetch(`/api/admin/outreach/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ outreachStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Update failed');
      }
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                outreachStatus,
                outreachUpdatedAt: data.data.outreachUpdatedAt,
              }
            : p
        )
      );
    } catch (err) {
      showToast({
        title: 'Failed to update',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const saveNotes = async (id: string) => {
    const notes = draftNotes[id] ?? '';
    setUpdatingId(id);
    try {
      const response = await secureFetch(`/api/admin/outreach/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ outreachNotes: notes || null }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Update failed');
      }
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, outreachNotes: notes || null, outreachUpdatedAt: data.data.outreachUpdatedAt }
            : p
        )
      );
      showToast({ title: 'Notes saved', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Failed to save notes',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const copyDmTemplate = async (profile: OutreachProfile) => {
    const text = buildDmTemplate(profile);
    try {
      await navigator.clipboard.writeText(text);
      showToast({
        title: 'DM template copied',
        description: 'Paste it into IG/FB/SMS and send.',
        variant: 'success',
      });
    } catch {
      showToast({
        title: 'Could not copy',
        description: 'Select and copy manually.',
        variant: 'error',
      });
    }
  };

  const toggleNotes = (id: string, current: string | null) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setDraftNotes((prev) => ({ ...prev, [id]: current || '' }));
  };

  const totalCount = useMemo(
    () => Object.values(counts).reduce((sum, n) => sum + n, 0),
    [counts]
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Outreach Helper</h1>
        <p className="mt-2 text-muted-foreground">
          For each unclaimed/claim-sent profile: search them on social, copy a DM
          template with their unique claim link, and track status.
        </p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All ({totalCount})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {STATUS_LABELS[s]} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search + claim filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, city, shop, or IG handle..."
          className="flex-1"
        />
        <select
          value={claimFilter}
          onChange={(e) => setClaimFilter(e.target.value as typeof claimFilter)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All claim statuses</option>
          <option value="unclaimed">Unclaimed only</option>
          <option value="claim_sent">Claim sent only</option>
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No profiles match. Adjust filters or import some via{' '}
              <a href="/admin/import" className="underline text-primary">
                /admin/import
              </a>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => {
            const isExpanded = expandedNotes.has(profile.id);
            return (
              <Card key={profile.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-primary text-lg">
                          {profile.displayName}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE_CLASS[profile.outreachStatus]}`}
                        >
                          {STATUS_LABELS[profile.outreachStatus]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {profile.city}, {profile.state}
                        {profile.shopName ? ` · ${profile.shopName}` : ''}
                        {profile.outreachEmail ? ` · ${profile.outreachEmail}` : ''}
                      </p>
                    </div>
                    <select
                      value={profile.outreachStatus}
                      onChange={(e) =>
                        updateStatus(profile.id, e.target.value as OutreachStatus)
                      }
                      disabled={updatingId === profile.id}
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm shrink-0"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <a
                      href={buildSearchUrl('ig', profile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                    >
                      📷 {profile.instagramHandle ? 'Open IG' : 'Find on IG'}
                    </a>
                    <a
                      href={buildSearchUrl('fb', profile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      📘 Find on FB
                    </a>
                    <a
                      href={buildSearchUrl('tiktok', profile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-pink-100 text-pink-800 hover:bg-pink-200 transition-colors"
                    >
                      🎵 Find on TikTok
                    </a>
                    <a
                      href={buildSearchUrl('google', profile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      🌐 Google
                    </a>
                    {profile.websiteUrl && (
                      <a
                        href={profile.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-cyan-100 text-cyan-800 hover:bg-cyan-200 transition-colors"
                      >
                        🔗 Website
                      </a>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyDmTemplate(profile)}
                    >
                      📋 Copy DM
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleNotes(profile.id, profile.outreachNotes)}
                    >
                      📝 {isExpanded ? 'Hide notes' : profile.outreachNotes ? 'Edit notes' : 'Add notes'}
                    </Button>
                    <a
                      href={`/barbers/${profile.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      View profile →
                    </a>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 mt-3 border-t pt-3">
                      <Textarea
                        value={draftNotes[profile.id] ?? ''}
                        onChange={(e) =>
                          setDraftNotes((prev) => ({
                            ...prev,
                            [profile.id]: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Notes (e.g., 'IG handle is @theirhandle, prefers texts')"
                        disabled={updatingId === profile.id}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveNotes(profile.id)}
                          disabled={updatingId === profile.id}
                        >
                          {updatingId === profile.id ? 'Saving...' : 'Save notes'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {profile.outreachUpdatedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last updated{' '}
                      {new Date(profile.outreachUpdatedAt).toLocaleString()}
                    </p>
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

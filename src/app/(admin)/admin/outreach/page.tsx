'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';
import { APP_CONFIG } from '@/config';

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
  noteCount: number;
  claimStatus: 'unclaimed' | 'claim_sent';
  claimToken: string | null;
  dataSource: string;
  user: { firstName: string; lastName: string };
}

interface OutreachNoteEntry {
  id: string;
  body: string;
  createdAt: string;
  author: { firstName: string; lastName: string } | null;
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

type OutreachChannel = 'ig' | 'fb' | 'tiktok' | 'google';

/**
 * Single source for channel identity. These are brand colors (IG purple, FB
 * blue, TikTok pink), not theme tokens — they intentionally sit outside the
 * `@theme` palette because the color IS the meaning here. Tailwind can't see
 * constructed class names, so each tint is a full literal.
 */
const OUTREACH_CHANNELS: Record<
  OutreachChannel,
  { emoji: string; tint: string; tintHover: string; label: (profile: OutreachProfile) => string }
> = {
  ig: {
    emoji: '📷',
    tint: 'bg-purple-100 text-purple-800',
    tintHover: 'hover:bg-purple-200',
    label: (profile) => (profile.instagramHandle ? 'Open IG' : 'Find on IG'),
  },
  fb: {
    emoji: '📘',
    tint: 'bg-blue-100 text-blue-800',
    tintHover: 'hover:bg-blue-200',
    label: () => 'Find on FB',
  },
  tiktok: {
    emoji: '🎵',
    tint: 'bg-pink-100 text-pink-800',
    tintHover: 'hover:bg-pink-200',
    label: () => 'Find on TikTok',
  },
  google: {
    emoji: '🌐',
    tint: 'bg-gray-100 text-gray-800',
    tintHover: 'hover:bg-gray-200',
    label: () => 'Google',
  },
};

const CHANNEL_ORDER: OutreachChannel[] = ['ig', 'fb', 'tiktok', 'google'];

const CHANNEL_LINK_CLASS =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors';

// Statuses that mirror a channel derive their tint from OUTREACH_CHANNELS;
// the rest are lifecycle states with their own meaning.
const STATUS_BADGE_CLASS: Record<OutreachStatus, string> = {
  not_contacted: 'bg-amber-100 text-amber-800',
  messaged_ig: OUTREACH_CHANNELS.ig.tint,
  messaged_fb: OUTREACH_CHANNELS.fb.tint,
  messaged_tiktok: OUTREACH_CHANNELS.tiktok.tint,
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

function buildSearchUrl(platform: OutreachChannel, profile: OutreachProfile) {
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
  // Real first names are letters only (allow internal hyphen/apostrophe for
  // names like "Mary-Jane" or "O'Brien"). This rejects IG handles stored as
  // firstName ("@datightest"), business names with spaces/digits, and any
  // symbol-laden value — all of which should fall through to the no-greeting
  // founder opener rather than producing a bot-tell "Hey @handle!".
  if (!/^[a-zA-Z][a-zA-Z'-]*$/.test(trimmed)) return false;
  return !NON_PERSON_NAME_TOKENS.has(trimmed.toLowerCase());
}

/**
 * Greeting prefix for the DM. Only greet by name when we have a genuine first
 * name — returns "Hey {Name}! " (trailing space, prepended to the intro).
 *
 * For handle-only or shop-only imports we return an empty string and let the
 * message open straight into the founder intro. "Hey @handle!" is the
 * signature of automated IG DM bots, so greeting a handle actively signals
 * "this is scripted" — worse than no greeting. The handle/shop still appears
 * in the body ("reserved a profile under X"), where it reads natural.
 */
function buildSalutation(profile: OutreachProfile): string {
  const first = profile.user.firstName?.trim();
  return isLikelyPersonName(first) ? `Hey ${first}! ` : '';
}


function buildDmTemplate(profile: OutreachProfile, personalNote?: string): string {
  // Outreach claim links must ALWAYS point at the live production domain —
  // never window.location.origin (which would be localhost / the LAN dev IP /
  // a Vercel preview URL depending on where the admin is working). A barber
  // can only claim on the real site. APP_CONFIG.domain is a hardcoded
  // constant ('conciergebarberregistry.com'), independent of NEXT_PUBLIC_APP_URL.
  const baseUrl = `https://${APP_CONFIG.domain}`;
  const claimUrl = profile.claimToken
    ? `${baseUrl}/claim/${profile.claimToken}`
    : `${baseUrl}/barbers/${profile.slug}`;

  const businessLabel = profile.shopName || profile.displayName;
  const salutation = buildSalutation(profile);

  // Graceful location handling — many IG/manual imports have no city/state.
  // Never render empty commas ("in , .") which looks broken/spammy.
  const city = profile.city?.trim();
  const state = profile.state?.trim();
  const locationClause = city && state ? ` in ${city}, ${state}` : state ? ` in ${state}` : '';
  // "when {city} clients search" → "when local clients search" when city unknown
  const searchPrefix = city ? `${city} ` : 'local ';

  // Optional personalization — injected only when the admin has typed a real
  // note for this profile. When empty, the block is omitted entirely so no
  // placeholder instruction text can ever leak into a sent message.
  const note = personalNote?.trim();
  const personalBlock = note ? `\n\n${note}` : '';

  return `${salutation}I'm Percy from Concierge Barber Registry — a local NJ founder.${personalBlock}

I'm building a license-verified directory for independent barbers and barbershops, and I reserved a profile under ${businessLabel}${locationClause}. Three things it actually solves:

→ Trust signal that converts: clients see your verified-license badge, your portfolio, and real reviews — not "DM for prices" guessing.

→ No middleman cut: I don't process payments or take a commission. Clients come to you direct — and you keep what you earn.

→ Findable by specialty: when ${searchPrefix}clients search "fade barber" or "hot towel shave," your profile surfaces — not just whoever paid for the ad slot.

Free to claim — no credit card to get started. Claim it here: ${claimUrl}

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
  // Outreach notes are an append-only thread per profile. Entries are lazy-
  // loaded (and cached) when a card's notes panel is first expanded.
  const [threads, setThreads] = useState<Record<string, OutreachNoteEntry[]>>({});
  const [threadLoading, setThreadLoading] = useState<Set<string>>(new Set());
  const [newEntry, setNewEntry] = useState<Record<string, string>>({});
  const [addingId, setAddingId] = useState<string | null>(null);
  // Optional per-profile personalization line injected into the copied DM.
  // Transient (not persisted) — typed at send time when there's something
  // genuine to say. Empty = the DM omits the personalization block entirely.
  const [dmNotes, setDmNotes] = useState<Record<string, string>>({});
  // Which profile's DM was just copied — drives the transient "✓ Copied"
  // button state (reverts after ~2s). Avoids a toast for a low-stakes action.
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Same lightweight pattern for a just-added note entry — the Add button
  // flips to "✓ Added" for ~2s instead of firing a success toast.
  const [addedId, setAddedId] = useState<string | null>(null);

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

  const loadThread = async (id: string) => {
    setThreadLoading((prev) => new Set(prev).add(id));
    try {
      const response = await fetch(`/api/admin/outreach/${id}/notes`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to load notes');
      }
      setThreads((prev) => ({ ...prev, [id]: data.data.entries }));
    } catch (err) {
      showToast({
        title: 'Failed to load notes',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setThreadLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const addNote = async (id: string) => {
    const body = (newEntry[id] ?? '').trim();
    if (!body) return;
    setAddingId(id);
    try {
      const response = await secureFetch(`/api/admin/outreach/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to add note');
      }
      const entry: OutreachNoteEntry = data.data.entry;
      // Append to the local thread (chronological), clear the input, and bump
      // the card's count + last-updated so the list reflects the new entry.
      setThreads((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), entry] }));
      setNewEntry((prev) => ({ ...prev, [id]: '' }));
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, noteCount: p.noteCount + 1, outreachUpdatedAt: entry.createdAt }
            : p
        )
      );
      // Inline "✓ Added" feedback (~2s) instead of a toast. Panel stays open —
      // a thread invites adding several entries in a row.
      setAddedId(id);
      window.setTimeout(() => setAddedId((cur) => (cur === id ? null : cur)), 2000);
    } catch (err) {
      showToast({
        title: 'Failed to add note',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setAddingId(null);
    }
  };

  const copyDmTemplate = async (profile: OutreachProfile) => {
    const text = buildDmTemplate(profile, dmNotes[profile.id]);
    try {
      await navigator.clipboard.writeText(text);
      // Lightweight inline feedback — the button flips to "✓ Copied" for ~2s
      // instead of firing a toast. Copy is a low-stakes action; a modal is
      // heavier than it warrants.
      setCopiedId(profile.id);
      window.setTimeout(
        () => setCopiedId((cur) => (cur === profile.id ? null : cur)),
        2000,
      );
    } catch {
      // A silent copy failure WOULD be confusing — keep the toast for errors.
      showToast({
        title: 'Could not copy',
        description: 'Select and copy manually.',
        variant: 'error',
      });
    }
  };

  const toggleNotes = (id: string) => {
    const willOpen = !expandedNotes.has(id);
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Lazy-load the thread the first time the panel opens; cache thereafter.
    if (willOpen && threads[id] === undefined && !threadLoading.has(id)) {
      void loadThread(id);
    }
  };

  const totalCount = useMemo(
    () => Object.values(counts).reduce((sum, n) => sum + n, 0),
    [counts]
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-heading">Outreach Helper</h1>
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

                  {/* Optional DM personalization — only fill when you have
                      something genuine to say. Left blank, the DM omits the
                      block entirely (no placeholder text leaks). */}
                  <div className="mb-3">
                    <Input
                      value={dmNotes[profile.id] ?? ''}
                      onChange={(e) =>
                        setDmNotes((prev) => ({ ...prev, [profile.id]: e.target.value }))
                      }
                      placeholder="Optional: 1 genuine personal line for the DM (e.g. 'Loved your fade work on that last reel')"
                      className="text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {CHANNEL_ORDER.map((channel) => {
                      const { emoji, tint, tintHover, label } = OUTREACH_CHANNELS[channel];
                      return (
                        <a
                          key={channel}
                          href={buildSearchUrl(channel, profile)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${CHANNEL_LINK_CLASS} ${tint} ${tintHover}`}
                        >
                          {emoji} {label(profile)}
                        </a>
                      );
                    })}
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
                      className={copiedId === profile.id ? 'text-green-600 border-green-600' : ''}
                    >
                      {copiedId === profile.id ? '✓ Copied' : '📋 Copy DM'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleNotes(profile.id)}
                    >
                      📝 {isExpanded ? 'Hide notes' : `Notes (${profile.noteCount})`}
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
                    <div className="mt-3 border-t pt-3 space-y-3">
                      {/* Append-only, author-attributed thread (oldest first). */}
                      {threadLoading.has(profile.id) &&
                      threads[profile.id] === undefined ? (
                        <p className="text-sm text-muted-foreground">Loading notes…</p>
                      ) : (threads[profile.id]?.length ?? 0) === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No notes yet — add the first one below.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {threads[profile.id]?.map((entry) => (
                            <li key={entry.id} className="text-sm">
                              <div className="text-xs text-muted-foreground">
                                {entry.author
                                  ? `${entry.author.firstName} ${entry.author.lastName}`.trim()
                                  : 'Unknown'}
                                {' · '}
                                {new Date(entry.createdAt).toLocaleString()}
                              </div>
                              <p className="whitespace-pre-wrap text-foreground">
                                {entry.body}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="space-y-2">
                        <Textarea
                          value={newEntry[profile.id] ?? ''}
                          onChange={(e) =>
                            setNewEntry((prev) => ({
                              ...prev,
                              [profile.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="Add a note (e.g., 'DMed on IG — no reply yet')"
                          disabled={addingId === profile.id}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => addNote(profile.id)}
                            disabled={
                              addingId === profile.id ||
                              !(newEntry[profile.id] ?? '').trim()
                            }
                            className={
                              addedId === profile.id
                                ? 'bg-green-700 hover:bg-green-700 text-white'
                                : ''
                            }
                          >
                            {addingId === profile.id
                              ? 'Adding…'
                              : addedId === profile.id
                                ? '✓ Added'
                                : 'Add note'}
                          </Button>
                        </div>
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

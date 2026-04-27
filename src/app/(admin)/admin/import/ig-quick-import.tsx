'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';

interface CreatedSummary {
  input: string;
  handle?: string;
  slug?: string;
  claimUrl?: string;
  publicUrl?: string;
  status: 'created' | 'skipped' | 'error';
  reason?: string;
}

interface ImportSummary {
  total: number;
  created: number;
  skipped: number;
  errored: number;
}

interface Props {
  onImported: (results: CreatedSummary[]) => void;
}

export function IgQuickImport({ onImported }: Props) {
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<CreatedSummary[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const lines = text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return;

    setSubmitting(true);
    setResults([]);
    setSummary(null);

    try {
      const response = await secureFetch('/api/admin/import/ig-quick-create', {
        method: 'POST',
        body: JSON.stringify({ entries: lines }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Import failed');
      }

      setResults(data.data.results);
      setSummary(data.data.summary);
      onImported(data.data.results);

      showToast({
        title: 'Import complete',
        description: `${data.data.summary.created} created, ${data.data.summary.skipped} skipped, ${data.data.summary.errored} failed.`,
        variant: data.data.summary.errored > 0 ? 'warning' : 'success',
      });

      // Clear the textarea on full success
      if (data.data.summary.errored === 0) {
        setText('');
      }
    } catch (err) {
      showToast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast({ title: `${label} copied`, variant: 'success' });
    } catch {
      showToast({
        title: 'Could not copy',
        description: 'Select and copy manually.',
        variant: 'error',
      });
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Quick Import from Instagram</CardTitle>
        <CardDescription>
          Paste Instagram URLs or @handles, one per line. Each one becomes an
          unclaimed profile with the handle pre-filled. Profiles stay hidden from
          public listings until the barber claims and fills in their city/state.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ig-entries">Instagram profiles</Label>
            <Textarea
              id="ig-entries"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={`https://www.instagram.com/twiztdabarber/\n@anotherbarber\nhttps://instagram.com/thirdbarber`}
              disabled={submitting}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {lines.length} {lines.length === 1 ? 'entry' : 'entries'} ready to
              import (max 50 per submission)
            </p>
          </div>

          <Button type="submit" disabled={submitting || lines.length === 0}>
            {submitting ? 'Importing...' : `Import ${lines.length || ''}`.trim()}
          </Button>
        </form>

        {summary && (
          <div className="mt-6 rounded-lg bg-muted/30 p-4 text-sm">
            <div className="font-semibold text-primary mb-2">Results</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {summary.created}
                </div>
                <div className="text-xs text-muted-foreground">Created</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.skipped}
                </div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">
                  {summary.errored}
                </div>
                <div className="text-xs text-muted-foreground">Errored</div>
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="text-sm font-semibold text-muted-foreground">
              Per-row status
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {results.map((r, idx) => (
                <div
                  key={`${r.input}-${idx}`}
                  className={
                    'rounded-md border p-3 text-sm ' +
                    (r.status === 'created'
                      ? 'border-green-200 bg-green-50/40'
                      : r.status === 'skipped'
                      ? 'border-blue-200 bg-blue-50/40'
                      : 'border-red-200 bg-red-50/40')
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium font-mono text-xs break-all">
                        {r.handle ? `@${r.handle}` : r.input}
                      </div>
                      {r.reason && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {r.reason}
                        </div>
                      )}
                    </div>
                    <span
                      className={
                        'shrink-0 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ' +
                        (r.status === 'created'
                          ? 'bg-green-100 text-green-800'
                          : r.status === 'skipped'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800')
                      }
                    >
                      {r.status}
                    </span>
                  </div>

                  {r.status === 'created' && r.claimUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 min-w-0 truncate text-xs text-muted-foreground">
                        {r.claimUrl}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(r.claimUrl!, 'Claim link')
                        }
                      >
                        Copy
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Find these in{' '}
              <a href="/admin/outreach" className="underline text-primary">
                Outreach
              </a>{' '}
              to copy the DM template + claim link in one click.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

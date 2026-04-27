'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';

interface PlaceResult {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  websiteUri: string | null;
  alreadyImported: boolean;
  existingSlug: string | null;
}

interface SelectedItem {
  result: PlaceResult;
  outreachEmail: string;
}

interface CreatedSummary {
  placeId: string;
  displayName: string;
  slug?: string;
  publicUrl?: string;
  claimUrl?: string;
  invitationStatus?: 'sent' | 'no_email' | 'failed';
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

export function GooglePlacesSearch({ onImported }: Props) {
  const { showToast } = useToast();
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selected, setSelected] = useState<Map<string, SelectedItem>>(new Map());
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [filterText, setFilterText] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setResults([]);
    setSelected(new Map());
    setImportSummary(null);
    setFilterText('');

    try {
      const response = await secureFetch('/api/admin/import/google-places/search', {
        method: 'POST',
        body: JSON.stringify({ city, state: state.toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Search failed');
      }

      const found: PlaceResult[] = data.data.results;
      setResults(found);

      if (found.length === 0) {
        showToast({
          title: 'No results',
          description: `No barbers found for "barber in ${city}, ${state}".`,
          variant: 'warning',
        });
      } else {
        showToast({
          title: `${found.length} results`,
          description: 'Review and select to import.',
          variant: 'success',
        });
      }
    } catch (err) {
      showToast({
        title: 'Search failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (result: PlaceResult) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(result.placeId)) {
        next.delete(result.placeId);
      } else {
        next.set(result.placeId, { result, outreachEmail: '' });
      }
      return next;
    });
  };

  const updateEmail = (placeId: string, email: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const item = next.get(placeId);
      if (item) {
        next.set(placeId, { ...item, outreachEmail: email });
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    setImportSummary(null);

    try {
      const items = Array.from(selected.values()).map(({ result, outreachEmail }) => ({
        placeId: result.placeId,
        displayName: result.displayName,
        city: result.city,
        state: result.state,
        zipCode: result.zipCode,
        phone: result.phone,
        websiteUri: result.websiteUri,
        formattedAddress: result.formattedAddress,
        outreachEmail: outreachEmail || undefined,
      }));

      const response = await secureFetch('/api/admin/import/google-places/create', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Import failed');
      }

      setImportSummary(data.data.summary);
      onImported(data.data.results);

      // Remove successfully imported entries from the result list and selection
      const importedIds = new Set(
        data.data.results
          .filter((r: CreatedSummary) => r.status === 'created' || r.status === 'skipped')
          .map((r: CreatedSummary) => r.placeId)
      );
      setResults((prev) =>
        prev.map((r) =>
          importedIds.has(r.placeId) ? { ...r, alreadyImported: true } : r
        )
      );
      setSelected(new Map());

      showToast({
        title: 'Import complete',
        description: `${data.data.summary.created} created, ${data.data.summary.skipped} skipped, ${data.data.summary.errored} failed.`,
        variant: data.data.summary.errored > 0 ? 'warning' : 'success',
      });
    } catch (err) {
      showToast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Google Places Import</CardTitle>
        <CardDescription>
          Search Google for barbers in a city, then bulk-import the ones you want as
          unclaimed profiles. Already-imported results are flagged. Add an outreach
          email per row to auto-send the claim invitation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gp-city">City</Label>
            <Input
              id="gp-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Austin"
              required
              disabled={searching}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gp-state">State</Label>
            <Input
              id="gp-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="TX"
              maxLength={2}
              required
              disabled={searching}
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={searching} className="w-full sm:w-auto">
              {searching ? 'Searching...' : 'Search Google Places'}
            </Button>
          </div>
        </form>

        {results.length > 0 && (
          <div className="space-y-3">
            <FilterAndBulkSelectHeader
              results={results}
              selected={selected}
              setSelected={setSelected}
              filterText={filterText}
              setFilterText={setFilterText}
              importing={importing}
              onImport={handleImport}
            />

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {results
                .filter((r) =>
                  matchesFilter(r, filterText)
                )
                .map((r) => {
                const isSelected = selected.has(r.placeId);
                const item = selected.get(r.placeId);
                return (
                  <div
                    key={r.placeId}
                    className={
                      'rounded-lg border p-4 transition-colors ' +
                      (r.alreadyImported
                        ? 'bg-muted/40 border-muted'
                        : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'bg-background hover:border-primary/40')
                    }
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(r)}
                        disabled={r.alreadyImported}
                        className="mt-1 rounded border-input"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-primary">{r.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              {r.formattedAddress}
                            </p>
                            {r.phone && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {r.phone}
                                {r.websiteUri && (
                                  <>
                                    {' · '}
                                    <a
                                      href={r.websiteUri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline"
                                    >
                                      website
                                    </a>
                                  </>
                                )}
                              </p>
                            )}
                          </div>
                          {r.alreadyImported && (
                            <span className="shrink-0 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              Already imported
                            </span>
                          )}
                        </div>

                        {isSelected && (
                          <div className="mt-3">
                            <Label
                              htmlFor={`email-${r.placeId}`}
                              className="text-xs"
                            >
                              Outreach email (optional, auto-sends claim invitation)
                            </Label>
                            <Input
                              id={`email-${r.placeId}`}
                              type="email"
                              placeholder="barber@example.com"
                              value={item?.outreachEmail ?? ''}
                              onChange={(e) =>
                                updateEmail(r.placeId, e.target.value)
                              }
                              className="mt-1"
                              disabled={importing}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {importSummary && (
          <div className="rounded-lg bg-muted/30 p-4 text-sm">
            <div className="font-semibold text-primary mb-2">Last import</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {importSummary.created}
                </div>
                <div className="text-xs text-muted-foreground">Created</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {importSummary.skipped}
                </div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">
                  {importSummary.errored}
                </div>
                <div className="text-xs text-muted-foreground">Errored</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function matchesFilter(result: PlaceResult, filter: string): boolean {
  if (!filter.trim()) return true;
  const needle = filter.toLowerCase();
  return (
    result.displayName.toLowerCase().includes(needle) ||
    result.formattedAddress.toLowerCase().includes(needle) ||
    (result.phone || '').toLowerCase().includes(needle) ||
    (result.city || '').toLowerCase().includes(needle)
  );
}

interface HeaderProps {
  results: PlaceResult[];
  selected: Map<string, SelectedItem>;
  setSelected: React.Dispatch<React.SetStateAction<Map<string, SelectedItem>>>;
  filterText: string;
  setFilterText: (v: string) => void;
  importing: boolean;
  onImport: () => void;
}

function FilterAndBulkSelectHeader({
  results,
  selected,
  setSelected,
  filterText,
  setFilterText,
  importing,
  onImport,
}: HeaderProps) {
  const visibleResults = useMemo(
    () => results.filter((r) => matchesFilter(r, filterText)),
    [results, filterText]
  );

  const selectableVisible = visibleResults.filter((r) => !r.alreadyImported);
  const visibleSelectedCount = selectableVisible.filter((r) =>
    selected.has(r.placeId)
  ).length;

  const allVisibleSelected =
    selectableVisible.length > 0 &&
    visibleSelectedCount === selectableVisible.length;
  const someVisibleSelected =
    visibleSelectedCount > 0 && visibleSelectedCount < selectableVisible.length;

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allVisibleSelected) {
        // Deselect all visible
        for (const r of selectableVisible) {
          next.delete(r.placeId);
        }
      } else {
        // Select all visible (skip already-selected to preserve their email field)
        for (const r of selectableVisible) {
          if (!next.has(r.placeId)) {
            next.set(r.placeId, { result: r, outreachEmail: '' });
          }
        }
      }
      return next;
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-b pb-3">
        <Input
          type="search"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter results by name, address, phone, or city..."
          className="sm:max-w-md"
        />
        <Button
          onClick={onImport}
          disabled={selected.size === 0 || importing}
          size="sm"
        >
          {importing ? 'Importing...' : `Import ${selected.size} Selected`}
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground py-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = someVisibleSelected;
            }}
            onChange={toggleSelectAll}
            disabled={selectableVisible.length === 0}
            className="rounded border-input"
          />
          <span>
            Select all visible ({selectableVisible.length} selectable
            {filterText ? ' after filter' : ''})
          </span>
        </label>
        <span>
          {visibleResults.length} of {results.length} shown · {selected.size}{' '}
          selected
        </span>
      </div>
    </>
  );
}

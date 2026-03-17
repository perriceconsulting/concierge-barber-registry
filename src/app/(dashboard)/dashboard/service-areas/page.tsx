'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useModal } from '@/components/ui/modal';
import { secureFetch } from '@/lib/csrf-client';
import { UpgradeBanner } from '@/components/subscription/upgrade-banner';
import { US_STATES, ROUTES } from '@/config';

interface ServiceArea {
  id: string;
  city: string;
  state: string;
  notes: string | null;
}

interface TravelDate {
  id: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  isActive: boolean;
}

interface ProfileInfo {
  offersMobileService: boolean;
  mobileServiceRadiusMiles: number | null;
}

export default function ServiceAreasPage() {
  const { showToast } = useToast();
  const { showConfirm } = useModal();

  // Service Areas state
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [areaForm, setAreaForm] = useState({ city: '', state: '', notes: '' });
  const [areaSaving, setAreaSaving] = useState(false);

  // Travel Dates state
  const [trips, setTrips] = useState<TravelDate[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TravelDate | null>(null);
  const [tripForm, setTripForm] = useState({ city: '', state: '', startDate: '', endDate: '', notes: '' });
  const [tripSaving, setTripSaving] = useState(false);

  // Profile info
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);

  // Subscription limits
  const [areaLimit, setAreaLimit] = useState<number>(2);
  const [tripLimit, setTripLimit] = useState<number>(1);

  const fetchAreas = useCallback(async () => {
    try {
      const res = await secureFetch('/api/barbers/service-areas');
      const data = await res.json();
      if (data.success) setAreas(data.data.serviceAreas);
    } catch {
      showToast({ title: 'Error', description: 'Failed to load service areas', variant: 'error' });
    } finally {
      setAreasLoading(false);
    }
  }, [showToast]);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await secureFetch('/api/barbers/travel-dates');
      const data = await res.json();
      if (data.success) setTrips(data.data.travelDates);
    } catch {
      showToast({ title: 'Error', description: 'Failed to load travel dates', variant: 'error' });
    } finally {
      setTripsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAreas();
    fetchTrips();

    // Fetch mobile service info + subscription limits
    async function fetchProfileAndLimits() {
      try {
        const [profileRes, subRes] = await Promise.all([
          fetch('/api/barbers/profile', { credentials: 'include' }),
          fetch('/api/barbers/subscription', { credentials: 'include' }),
        ]);
        if (profileRes.ok) {
          const data = await profileRes.json();
          const profile = data.data?.barberProfile || data.barberProfile;
          if (profile) {
            setProfileInfo({
              offersMobileService: profile.offersMobileService || false,
              mobileServiceRadiusMiles: profile.mobileServiceRadiusMiles || null,
            });
          }
        }
        if (subRes.ok) {
          const data = await subRes.json();
          if (data.success) {
            const usage = data.data.usage;
            if (usage.serviceAreas?.limit != null) setAreaLimit(usage.serviceAreas.limit);
            if (usage.travelDates?.limit != null) setTripLimit(usage.travelDates.limit);
          }
        }
      } catch { /* ignore */ }
    }
    fetchProfileAndLimits();
  }, [fetchAreas, fetchTrips]);

  // Service Area handlers
  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    setAreaSaving(true);
    try {
      const res = await secureFetch('/api/barbers/service-areas', {
        method: 'POST',
        body: JSON.stringify({
          city: areaForm.city,
          state: areaForm.state,
          notes: areaForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({ title: 'Added', description: `${areaForm.city}, ${areaForm.state} added`, variant: 'success' });
        setAreaForm({ city: '', state: '', notes: '' });
        setShowAreaForm(false);
        fetchAreas();
      } else {
        showToast({ title: 'Error', description: data.error?.message || 'Failed to add', variant: 'error' });
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to add service area', variant: 'error' });
    } finally {
      setAreaSaving(false);
    }
  };

  const handleDeleteArea = (area: ServiceArea) => {
    showConfirm({
      title: 'Remove Service Area',
      description: `Remove ${area.city}, ${area.state} from your service areas?`,
      confirmText: 'Remove',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const res = await secureFetch(`/api/barbers/service-areas/${area.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast({ title: 'Removed', description: 'Service area removed', variant: 'success' });
            fetchAreas();
          }
        } catch {
          showToast({ title: 'Error', description: 'Failed to remove', variant: 'error' });
        }
      },
    });
  };

  // Travel Date handlers
  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setTripSaving(true);
    try {
      const isEdit = !!editingTrip;
      const url = isEdit ? `/api/barbers/travel-dates/${editingTrip.id}` : '/api/barbers/travel-dates';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await secureFetch(url, {
        method,
        body: JSON.stringify({
          city: tripForm.city,
          state: tripForm.state,
          startDate: tripForm.startDate,
          endDate: tripForm.endDate,
          notes: tripForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({ title: isEdit ? 'Updated' : 'Added', description: `Trip to ${tripForm.city} ${isEdit ? 'updated' : 'added'}`, variant: 'success' });
        setTripForm({ city: '', state: '', startDate: '', endDate: '', notes: '' });
        setShowTripForm(false);
        setEditingTrip(null);
        fetchTrips();
      } else {
        showToast({ title: 'Error', description: data.error?.message || 'Failed to save', variant: 'error' });
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to save travel date', variant: 'error' });
    } finally {
      setTripSaving(false);
    }
  };

  const handleEditTrip = (trip: TravelDate) => {
    setEditingTrip(trip);
    setTripForm({
      city: trip.city,
      state: trip.state,
      startDate: trip.startDate.split('T')[0],
      endDate: trip.endDate.split('T')[0],
      notes: trip.notes || '',
    });
    setShowTripForm(true);
  };

  const handleDeleteTrip = (trip: TravelDate) => {
    showConfirm({
      title: 'Remove Travel Date',
      description: `Remove trip to ${trip.city}, ${trip.state}?`,
      confirmText: 'Remove',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const res = await secureFetch(`/api/barbers/travel-dates/${trip.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast({ title: 'Removed', description: 'Travel date removed', variant: 'success' });
            fetchTrips();
          }
        } catch {
          showToast({ title: 'Error', description: 'Failed to remove', variant: 'error' });
        }
      },
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (s.getFullYear() !== new Date().getFullYear()) {
      return `${s.toLocaleDateString('en-US', { ...opts, year: 'numeric' })} - ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
    }
    return `${s.toLocaleDateString('en-US', opts)} - ${e.toLocaleDateString('en-US', opts)}`;
  };

  const isPast = (endDate: string) => new Date(endDate) < new Date();
  const activeTrips = trips.filter((t) => !isPast(t.endDate) && t.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Service Areas & Travel</h1>
        <p className="text-muted-foreground mt-2">
          Define where you serve clients and announce upcoming travel
        </p>
      </div>

      {/* Mobile Service Summary */}
      {profileInfo && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="font-medium">
                    Mobile Service: {profileInfo.offersMobileService ? (
                      <span className="text-green-600">
                        Enabled{profileInfo.mobileServiceRadiusMiles ? ` (${profileInfo.mobileServiceRadiusMiles} mi radius)` : ''}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not enabled</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Manage in your profile settings</p>
                </div>
              </div>
              <Link href={ROUTES.DASHBOARD_PROFILE}>
                <Button variant="outline" size="sm">Edit Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Areas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Areas</CardTitle>
              <CardDescription>
                Cities you regularly serve beyond your home base ({areas.length}/{areaLimit})
              </CardDescription>
            </div>
            {!showAreaForm && areas.length < areaLimit && (
              <Button onClick={() => setShowAreaForm(true)} size="sm">Add Area</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {areas.length >= areaLimit && !showAreaForm && (
            <div className="mb-4">
              <UpgradeBanner feature="service areas" currentUsage={areas.length} limit={areaLimit} />
            </div>
          )}
          {showAreaForm && (
            <form onSubmit={handleAddArea} className="mb-6 p-4 border rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="area-city">City</Label>
                  <Input
                    id="area-city"
                    value={areaForm.city}
                    onChange={(e) => setAreaForm({ ...areaForm, city: e.target.value })}
                    placeholder="e.g., Brooklyn"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="area-state">State</Label>
                  <select
                    id="area-state"
                    value={areaForm.state}
                    onChange={(e) => setAreaForm({ ...areaForm, state: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="area-notes">Notes (optional)</Label>
                <Input
                  id="area-notes"
                  value={areaForm.notes}
                  onChange={(e) => setAreaForm({ ...areaForm, notes: e.target.value })}
                  placeholder="e.g., Weekends only"
                  maxLength={255}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={areaSaving}>
                  {areaSaving ? 'Adding...' : 'Add Area'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAreaForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {areasLoading ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
          ) : areas.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No service areas added yet. Add cities you regularly travel to for work.
            </p>
          ) : (
            <div className="space-y-2">
              {areas.map((area) => (
                <div key={area.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium">{area.city}, {area.state}</span>
                    {area.notes && (
                      <span className="text-sm text-muted-foreground ml-2">— {area.notes}</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteArea(area)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Traveling Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Traveling Schedule</CardTitle>
              <CardDescription>
                Let clients know when you&apos;ll be visiting other cities ({activeTrips.length}/{tripLimit} upcoming)
              </CardDescription>
            </div>
            {!showTripForm && activeTrips.length < tripLimit && (
              <Button onClick={() => { setEditingTrip(null); setTripForm({ city: '', state: '', startDate: '', endDate: '', notes: '' }); setShowTripForm(true); }} size="sm">
                Add Trip
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showTripForm && (
            <form onSubmit={handleAddTrip} className="mb-6 p-4 border rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="trip-city">City</Label>
                  <Input
                    id="trip-city"
                    value={tripForm.city}
                    onChange={(e) => setTripForm({ ...tripForm, city: e.target.value })}
                    placeholder="e.g., Miami"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="trip-state">State</Label>
                  <select
                    id="trip-state"
                    value={tripForm.state}
                    onChange={(e) => setTripForm({ ...tripForm, state: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="trip-start">Start Date</Label>
                  <Input
                    id="trip-start"
                    type="date"
                    value={tripForm.startDate}
                    onChange={(e) => setTripForm({ ...tripForm, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="trip-end">End Date</Label>
                  <Input
                    id="trip-end"
                    type="date"
                    value={tripForm.endDate}
                    onChange={(e) => setTripForm({ ...tripForm, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="trip-notes">Notes (optional)</Label>
                <Textarea
                  id="trip-notes"
                  value={tripForm.notes}
                  onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
                  placeholder="e.g., Available for house calls, staying at downtown hotel"
                  rows={2}
                  maxLength={500}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={tripSaving}>
                  {tripSaving ? 'Saving...' : editingTrip ? 'Update Trip' : 'Add Trip'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowTripForm(false); setEditingTrip(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {activeTrips.length >= tripLimit && !showTripForm && (
            <div className="mb-4">
              <UpgradeBanner feature="travel dates" currentUsage={activeTrips.length} limit={tripLimit} />
            </div>
          )}

          {tripsLoading ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
          ) : trips.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No travel dates added. Post upcoming trips so clients in other cities can find you.
            </p>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => {
                const past = isPast(trip.endDate);
                return (
                  <div key={trip.id} className={`p-3 border rounded-lg ${past ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{trip.city}, {trip.state}</span>
                          {past && <Badge variant="outline">Past</Badge>}
                          {!trip.isActive && !past && <Badge variant="outline">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDateRange(trip.startDate, trip.endDate)}
                        </p>
                        {trip.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{trip.notes}</p>
                        )}
                      </div>
                      {!past && (
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleEditTrip(trip)}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteTrip(trip)}>Remove</Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

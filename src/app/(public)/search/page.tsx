'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/layout/container';
import Link from 'next/link';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SEARCH');

interface SpecialtyItem {
  specialty: { id: string; name: string };
}

interface SearchBarber {
  id: string;
  displayName: string;
  slug: string;
  tagline: string | null;
  city: string;
  state: string;
  averageRating: number;
  totalReviews: number;
  yearsExperience: number | null;
  licenseVerified: boolean;
  verificationStatus: string;
  offersMobileService?: boolean;
  mobileServiceRadiusMiles?: number | null;
  specialties: SpecialtyItem[];
  portfolioImages: Array<{ imageUrl: string }>;
  serviceAreas?: Array<{ city: string; state: string }>;
  travelDates?: Array<{ city: string; state: string; startDate: string; endDate: string }>;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    specialty: '',
    minRating: 0,
    verifiedOnly: false,
    mobileService: false,
  });
  const [barbers, setBarbers] = useState<SearchBarber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBarbers = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (filters.city) params.append('city', filters.city);
      if (filters.state) params.append('state', filters.state);
      if (filters.minRating > 0) params.append('min_rating', filters.minRating.toString());
      if (filters.mobileService) params.append('mobile_service', 'true');
      // Note: specialty filter would need the specialty slug, not name
      // We'll filter specialties client-side for now

      const response = await fetch(`/api/barbers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBarbers(data.data.barbers || []);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch barbers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters]);

  // Fetch barbers on mount and when the query or filters change
  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  // Filter barbers client-side for specialty and verification
  const filteredBarbers = barbers.filter((barber) => {
    // Specialty filter (client-side since we use specialty name, not slug)
    const matchesSpecialty = !filters.specialty ||
      barber.specialties?.some((item: SpecialtyItem) =>
        item.specialty?.name?.toLowerCase().includes(filters.specialty.toLowerCase())
      );

    // Verified filter
    const matchesVerified = !filters.verifiedOnly ||
      (barber.licenseVerified === true && barber.verificationStatus === 'approved');

    return matchesSpecialty && matchesVerified;
  });

  return (
    <div className="py-10">
      <Container>
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-heading mb-4">Find Your Barber</h1>
          <div className="flex gap-4">
            <Input
              type="search"
              placeholder="Search by name, city, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button>Search</Button>
          </div>
        </div>

        {/* Filters Sidebar & Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Filters */}
          <aside className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    placeholder="Enter city"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <Input
                    placeholder="e.g., NY"
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Specialty</label>
                  <Input
                    placeholder="e.g., Fades"
                    value={filters.specialty}
                    onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Minimum Rating</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                  >
                    <option value={0}>Any</option>
                    <option value={3}>3+ stars</option>
                    <option value={4}>4+ stars</option>
                    <option value={4.5}>4.5+ stars</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="verifiedOnly"
                    checked={filters.verifiedOnly}
                    onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                    className="rounded border-input"
                  />
                  <label htmlFor="verifiedOnly" className="text-sm font-medium cursor-pointer">
                    Verified barbers only
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mobileService"
                    checked={filters.mobileService}
                    onChange={(e) => setFilters({ ...filters, mobileService: e.target.checked })}
                    className="rounded border-input"
                  />
                  <label htmlFor="mobileService" className="text-sm font-medium cursor-pointer">
                    Offers mobile/house calls
                  </label>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setFilters({ city: '', state: '', specialty: '', minRating: 0, verifiedOnly: false, mobileService: false })}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <div className="md:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredBarbers.length} barber{filteredBarbers.length !== 1 ? 's' : ''} found
              </p>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option>Sort by Rating</option>
                <option>Sort by Distance</option>
                <option>Sort by Newest</option>
              </select>
            </div>

            {/* Barber Cards */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading barbers...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredBarbers.map((barber) => (
                  <Link key={barber.id} href={`/barbers/${barber.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">{barber.displayName}</CardTitle>
                            {barber.licenseVerified && barber.verificationStatus === 'approved' && (
                              <Badge variant="default" className="text-xs">
                                ✓ Verified
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {barber.city}, {barber.state}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                          <span className="font-semibold">{barber.averageRating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({barber.totalReviews})
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {barber.tagline && (
                        <p className="text-sm text-muted-foreground mb-3 italic">{barber.tagline}</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {barber.specialties?.map((item: SpecialtyItem) => (
                          <Badge key={item.specialty.id} variant="secondary">
                            {item.specialty.name}
                          </Badge>
                        ))}
                      </div>
                      {barber.yearsExperience && (
                        <p className="text-xs text-muted-foreground mt-3">
                          {barber.yearsExperience}+ years experience
                        </p>
                      )}
                      {/* Contextual badges */}
                      <div className="flex gap-2 flex-wrap mt-2">
                        {barber.offersMobileService && (
                          <Badge variant="outline" className="text-xs">Mobile Service</Badge>
                        )}
                        {barber.serviceAreas && barber.serviceAreas.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Serves {barber.serviceAreas.length} area{barber.serviceAreas.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {barber.travelDates && barber.travelDates.length > 0 && (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                            Visiting {barber.travelDates[0].city} soon
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoading && filteredBarbers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  No barbers found matching your criteria
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ city: '', state: '', specialty: '', minRating: 0, verifiedOnly: false, mobileService: false });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

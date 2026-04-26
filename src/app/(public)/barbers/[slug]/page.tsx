'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/layout/container';
import { useToast } from '@/components/ui/toast';
import { BarberStructuredData } from '@/components/seo/barber-structured-data';
import { Breadcrumb } from '@/components/breadcrumb';
import { RemovalRequestForm } from '@/components/barber/removal-request-form';
import { TierBadge } from '@/components/subscription/tier-badge';
import { createLogger } from '@/lib/logger';
import { secureFetch } from '@/lib/csrf-client';
import type { TierName } from '@/lib/subscription';

const logger = createLogger('BARBER');

interface BarberSpecialtyItem {
  specialty: { id: number; name: string; slug: string };
}

interface PortfolioImageItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  price: number;
  duration: number;
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  client: { firstName: string; lastName: string };
}

interface BarberProfile {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  tagline: string | null;
  yearsExperience: number | null;
  averageRating: number;
  totalReviews: number;
  city: string;
  state: string;
  zipCode: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  shopName: string | null;
  shopAddressLine1: string | null;
  acceptsWalkIns: boolean;
  acceptsAppointments: boolean;
  offersMobileService?: boolean;
  mobileServiceRadiusMiles?: number | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  claimStatus?: 'unclaimed' | 'claim_sent' | 'claimed';
  claimToken?: string | null;
  specialties: BarberSpecialtyItem[];
  portfolioImages: PortfolioImageItem[];
  services: ServiceItem[];
  reviews: ReviewItem[];
  serviceAreas?: Array<{ id: string; city: string; state: string; notes: string | null }>;
  travelDates?: Array<{ id: string; city: string; state: string; startDate: string; endDate: string; notes: string | null }>;
  user?: { phone: string | null; email: string };
}

export default function BarberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const slug = params.slug as string;

  const [barber, setBarber] = useState<BarberProfile | null>(null);
  const [barberTier, setBarberTier] = useState<TierName>('starter');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    service: '',
    preferredDate: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setUserRole(data.data.user.role);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchBarberProfile();
    }
  }, [slug]);

  const fetchBarberProfile = async () => {
    try {
      const response = await fetch(`/api/barbers/${slug}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setBarber(data.data.barberProfile);
        if (data.data.tier) setBarberTier(data.data.tier);
      }
    } catch (error) {
      logger.error('Failed to fetch barber profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  const handleContactClick = () => {
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in required',
        description: 'Please create a client account to contact barbers.',
        variant: 'error',
      });
      // Redirect to sign up page after a short delay
      setTimeout(() => {
        router.push('/register');
      }, 2000);
      return;
    }

    if (userRole !== 'client') {
      showToast({
        title: 'Client account required',
        description: 'Only clients can contact barbers. Please create a client account.',
        variant: 'error',
      });
      return;
    }

    setShowContactForm(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await secureFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          barberProfileId: barber?.id,
          clientName: contactForm.name,
          clientEmail: contactForm.email,
          clientPhone: contactForm.phone || undefined,
          message: contactForm.message,
          serviceInterested: contactForm.service || undefined,
          preferredDate: contactForm.preferredDate || undefined,
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showToast({
          title: 'Success!',
          description: 'Contact request sent! The barber will get back to you soon.',
          variant: 'success',
        });
        setShowContactForm(false);
        setContactForm({ name: '', email: '', phone: '', message: '', service: '', preferredDate: '' });
      } else {
        showToast({
          title: 'Error',
          description: data.error?.message || 'Failed to send contact request',
          variant: 'error',
        });
      }
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to send contact request. Please try again.',
        variant: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="py-10">
        <Container>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading barber profile...</p>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="py-10">
        <Container>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Barber profile not found</p>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  const primarySpecialty = barber.specialties?.[0]?.specialty.name;
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Barbers', path: '/barbers' },
    { name: barber.displayName, path: `/barbers/${barber.slug}` },
  ];
  const isUnclaimed = barber.claimStatus && barber.claimStatus !== 'claimed';

  return (
    <>
      {barber && <BarberStructuredData barber={barber} />}
      <article className="py-10">
        <Container>
        <Breadcrumb items={breadcrumbItems} className="mb-6" />
        {isUnclaimed && (
          <div className="mb-6 rounded-lg border-2 border-amber-300 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="h-6 w-6 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0l-7.1 12.25A2 2 0 005 19z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900">
                  Unclaimed Profile
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  This profile was created from public information. The barber
                  hasn&apos;t verified or customized it yet.
                </p>
                <p className="mt-3 text-sm">
                  Are you {barber.displayName}?{' '}
                  {barber.claimToken ? (
                    <a
                      href={`/claim/${barber.claimToken}`}
                      className="font-semibold text-primary underline underline-offset-2"
                    >
                      Claim this profile →
                    </a>
                  ) : (
                    <a
                      href="/contact"
                      className="font-semibold text-primary underline underline-offset-2"
                    >
                      Contact us to claim it →
                    </a>
                  )}
                </p>
                <details className="mt-4 group">
                  <summary className="cursor-pointer text-xs text-amber-900/70 hover:text-amber-900 select-none">
                    Don&apos;t want a profile here? Request removal →
                  </summary>
                  <RemovalRequestForm slug={barber.slug} />
                </details>
              </div>
            </div>
          </div>
        )}
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-primary">{barber.displayName}</h1>
                <TierBadge tier={barberTier} />
              </div>
              {barber.tagline && (
                <p className="text-xl text-muted-foreground italic">{barber.tagline}</p>
              )}
              <div className="flex items-center gap-4 mt-4">
                {barber.averageRating > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="flex">{renderStars(Math.round(barber.averageRating))}</div>
                      <span className="font-semibold ml-1">{barber.averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({barber.reviews?.length || 0} reviews)</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                  </>
                )}
                {barber.yearsExperience && (
                  <span className="text-muted-foreground">{barber.yearsExperience} years experience</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleContactClick}>Contact</Button>
              <Button variant="outline">Save</Button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {barber.acceptsWalkIns && <Badge variant="secondary">Walk-ins Welcome</Badge>}
            {barber.acceptsAppointments && <Badge variant="secondary">By Appointment</Badge>}
            {barber.offersMobileService && (
              <Badge variant="secondary">
                Mobile Service{barber.mobileServiceRadiusMiles ? ` (${barber.mobileServiceRadiusMiles} mi)` : ''}
              </Badge>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{barber.bio}</p>
              </CardContent>
            </Card>

            {/* Specialties */}
            {barber.specialties && barber.specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Specialties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {barber.specialties.map((item) => (
                      <Badge key={item.specialty.id} variant="outline">
                        {item.specialty.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            {barber.portfolioImages && barber.portfolioImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio</CardTitle>
                  <CardDescription>View {barber.displayName}&apos;s work</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {barber.portfolioImages.map((image) => (
                      <div key={image.id} className="aspect-square bg-muted relative rounded-lg overflow-hidden group">
                        <Image
                          src={image.imageUrl}
                          alt={
                            image.caption ||
                            (primarySpecialty
                              ? `${primarySpecialty} by ${barber.displayName}, barber in ${barber.city}, ${barber.state}`
                              : `Haircut by ${barber.displayName}, barber in ${barber.city}, ${barber.state}`)
                          }
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        {image.caption && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <p className="text-white text-sm">{image.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services & Pricing */}
            {barber.services && barber.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services & Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {barber.services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.durationMinutes} minutes</p>
                        </div>
                        <p className="font-semibold">${(service.priceCents / 100).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {barber.reviews && barber.reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Reviews ({barber.reviews.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {barber.reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">
                            {review.client.firstName} {review.client.lastName}
                          </span>
                          <div className="flex">{renderStars(review.rating)}</div>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{barber.address}</p>
                  <p className="text-sm">{barber.city}, {barber.state} {barber.zipCode}</p>
                </div>
                {barber.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{barber.phone}</p>
                  </div>
                )}
                {barber.website && (
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a href={barber.website} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      {barber.website}
                    </a>
                  </div>
                )}
                {barber.instagram && (
                  <div>
                    <p className="text-sm text-muted-foreground">Instagram</p>
                    <a href={`https://instagram.com/${barber.instagram.replace('@', '')}`} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      {barber.instagram}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Also Serves */}
            {barber.serviceAreas && barber.serviceAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Also Serves</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {barber.serviceAreas.map((area) => (
                      <div key={area.id} className="flex items-start gap-2">
                        <span className="text-muted-foreground shrink-0">📍</span>
                        <div>
                          <p className="font-medium text-sm">{area.city}, {area.state}</p>
                          {area.notes && <p className="text-xs text-muted-foreground">{area.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visiting Soon */}
            {barber.travelDates && barber.travelDates.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/30">
                <CardHeader>
                  <CardTitle>Visiting Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {barber.travelDates.map((trip) => {
                      const start = new Date(trip.startDate);
                      const end = new Date(trip.endDate);
                      const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
                      const dateRange = `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
                      return (
                        <div key={trip.id} className="flex items-start gap-2">
                          <span className="text-muted-foreground shrink-0">✈️</span>
                          <div>
                            <p className="font-medium text-sm">{trip.city}, {trip.state}</p>
                            <p className="text-xs text-amber-700">{dateRange}</p>
                            {trip.notes && <p className="text-xs text-muted-foreground">{trip.notes}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Contact {barber.displayName}</CardTitle>
                <CardDescription>Send a message to inquire about services</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service">Service Interested In</Label>
                    <select
                      id="service"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={contactForm.service}
                      onChange={(e) => setContactForm({ ...contactForm, service: e.target.value })}
                    >
                      <option value="">Select a service</option>
                      {barber.services.map((service) => (
                        <option key={service.id} value={service.name}>{service.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Preferred Date</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={contactForm.preferredDate}
                      onChange={(e) => setContactForm({ ...contactForm, preferredDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Send Message</Button>
                    <Button type="button" variant="outline" onClick={() => setShowContactForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </Container>
    </article>
    </>
  );
}

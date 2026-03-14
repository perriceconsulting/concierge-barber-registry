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

export default function BarberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const slug = params.slug as string;

  const [barber, setBarber] = useState<any>(null);
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
      }
    } catch (error) {
      console.error('Failed to fetch barber profile:', error);
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
    // TODO: Implement contact form API call
    showToast({
      title: 'Success!',
      description: 'Contact request sent!',
      variant: 'success',
    });
    setShowContactForm(false);
    setContactForm({ name: '', email: '', phone: '', message: '', service: '', preferredDate: '' });
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

  return (
    <>
      {barber && <BarberStructuredData barber={barber} />}
      <div className="py-10">
        <Container>
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-primary mb-2">{barber.displayName}</h1>
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
          </div>
        </div>

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
                    {barber.specialties.map((item: any) => (
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
                  <CardDescription>View {barber.displayName}'s work</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {barber.portfolioImages.map((image: any) => (
                      <div key={image.id} className="aspect-square bg-muted relative rounded-lg overflow-hidden group">
                        <Image
                          src={image.imageUrl}
                          alt={image.caption || 'Portfolio image'}
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
                    {barber.services.map((service: any) => (
                      <div key={service.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.duration} minutes</p>
                        </div>
                        <p className="font-semibold">${service.price}</p>
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
                    {barber.reviews.map((review: any) => (
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

            {/* Operating Hours */}
            {barber.operatingHours && barber.operatingHours.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Operating Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {barber.operatingHours.map((hours: any) => {
                      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      return (
                        <div key={hours.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{days[hours.dayOfWeek]}</span>
                          <span className="font-medium">
                            {hours.isClosed ? 'Closed' : `${hours.openTime} - ${hours.closeTime}`}
                          </span>
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
                      {barber.services.map((service: any) => (
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
    </div>
    </>
  );
}

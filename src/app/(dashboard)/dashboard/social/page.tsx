'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';
import { UpgradeBanner } from '@/components/subscription/upgrade-banner';
import { generatePostImage, downloadImage } from '@/lib/social-image';
import {
  PLATFORM_CONFIGS,
  TEMPLATE_CONFIGS,
  type SocialPlatform,
  type TemplateType,
  type SocialPostData,
  type PlatformConfig,
} from '@/types/social';

import { PortfolioShowcase } from '@/components/social/templates/portfolio-showcase';
import { ServiceSpotlight } from '@/components/social/templates/service-spotlight';
import { ReviewTestimonial } from '@/components/social/templates/review-testimonial';
import { InTown } from '@/components/social/templates/in-town';
import { NewClientSpecial } from '@/components/social/templates/new-client-special';

interface PortfolioImage {
  id: string;
  imageUrl: string;
  caption: string | null;
}

interface ServiceItem {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  user?: { firstName: string; lastName: string };
  client?: { firstName: string; lastName: string };
}

interface TravelDateItem {
  id: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
}

type Step = 'template' | 'platform' | 'customize' | 'preview';

export default function SocialPostsPage() {
  const { showToast } = useToast();
  const renderRef = useRef<HTMLDivElement>(null);

  // Data state
  const [profile, setProfile] = useState<{ displayName: string; tagline?: string; city: string; state: string; instagramHandle?: string; tiktokHandle?: string; slug?: string } | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [travelDates, setTravelDates] = useState<TravelDateItem[]>([]);
  const [tier, setTier] = useState<'starter' | 'professional' | 'elite'>('starter');
  const [usage, setUsage] = useState({ current: 0, limit: 3 });
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [generating, setGenerating] = useState(false);

  // Customization state
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState('');
  const [selectedTravelId, setSelectedTravelId] = useState('');
  const [promoText, setPromoText] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, portfolioRes, servicesRes, subRes, travelRes, socialRes] = await Promise.all([
        fetch('/api/barbers/profile', { credentials: 'include' }),
        secureFetch('/api/barbers/portfolio'),
        secureFetch('/api/barbers/services'),
        fetch('/api/barbers/subscription', { credentials: 'include' }),
        secureFetch('/api/barbers/travel-dates?active=true'),
        secureFetch('/api/barbers/social-posts'),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        const p = data.data?.barberProfile || data.barberProfile;
        if (p) setProfile(p);

        // Fetch reviews via slug
        if (p?.slug) {
          const reviewsRes = await fetch(`/api/barbers/${p.slug}`);
          if (reviewsRes.ok) {
            const rData = await reviewsRes.json();
            setReviews(rData.data?.barber?.reviews || []);
          }
        }
      }

      if (portfolioRes.ok) {
        const data = await portfolioRes.json();
        if (data.success) setPortfolio(data.data.images || []);
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        if (data.success) setServices(data.data.services || []);
      }

      if (subRes.ok) {
        const data = await subRes.json();
        if (data.success) setTier(data.data.tier || 'starter');
      }

      if (travelRes.ok) {
        const data = await travelRes.json();
        if (data.success) setTravelDates(data.data.travelDates || []);
      }

      if (socialRes.ok) {
        const data = await socialRes.json();
        if (data.success) {
          setUsage({ current: data.data.current, limit: data.data.limit ?? Infinity });
        }
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to load data', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasData = (key: string) => {
    switch (key) {
      case 'portfolio': return portfolio.length > 0;
      case 'services': return services.length > 0;
      case 'reviews': return reviews.length > 0;
      case 'travelDates': return travelDates.length > 0;
      default: return true;
    }
  };

  const buildPostData = (): SocialPostData => {
    const base: SocialPostData = {
      barberName: profile?.displayName || 'Barber',
      tagline: profile?.tagline,
      city: profile?.city || '',
      state: profile?.state || '',
      tier,
      instagramHandle: profile?.instagramHandle,
      tiktokHandle: profile?.tiktokHandle,
    };

    if (selectedTemplate === 'portfolio-showcase') {
      base.portfolioImageUrl = selectedImageUrl;
      const img = portfolio.find(p => p.imageUrl === selectedImageUrl);
      base.portfolioCaption = img?.caption || undefined;
    }

    if (selectedTemplate === 'service-spotlight') {
      const svc = services.find(s => s.id === selectedServiceId);
      if (svc) {
        base.serviceName = svc.name;
        base.servicePriceCents = svc.priceCents;
        base.serviceDurationMinutes = svc.durationMinutes;
      }
    }

    if (selectedTemplate === 'review-testimonial') {
      const rev = reviews.find(r => r.id === selectedReviewId);
      if (rev) {
        base.reviewRating = rev.rating;
        base.reviewComment = rev.comment || undefined;
        const reviewer = rev.user || rev.client;
        base.reviewerName = reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : undefined;
      }
    }

    if (selectedTemplate === 'in-town') {
      const trip = travelDates.find(t => t.id === selectedTravelId);
      if (trip) {
        base.travelCity = trip.city;
        base.travelState = trip.state;
        base.travelStartDate = trip.startDate;
        base.travelEndDate = trip.endDate;
      }
    }

    if (selectedTemplate === 'new-client-special') {
      base.promoText = promoText;
    }

    return base;
  };

  const renderTemplate = (postData: SocialPostData, platformConfig: PlatformConfig) => {
    switch (selectedTemplate) {
      case 'portfolio-showcase': return <PortfolioShowcase data={postData} platform={platformConfig} />;
      case 'service-spotlight': return <ServiceSpotlight data={postData} platform={platformConfig} />;
      case 'review-testimonial': return <ReviewTestimonial data={postData} platform={platformConfig} />;
      case 'in-town': return <InTown data={postData} platform={platformConfig} />;
      case 'new-client-special': return <NewClientSpecial data={postData} platform={platformConfig} />;
      default: return null;
    }
  };

  const handleGenerate = async () => {
    if (!renderRef.current || !selectedTemplate || !selectedPlatform) return;

    setGenerating(true);
    try {
      // Record the generation (checks limit)
      const res = await secureFetch('/api/barbers/social-posts', {
        method: 'POST',
        body: JSON.stringify({ templateType: selectedTemplate, platform: selectedPlatform }),
      });
      const data = await res.json();

      if (!data.success) {
        showToast({ title: 'Limit Reached', description: data.error?.message || 'Upgrade to generate more posts', variant: 'error' });
        return;
      }

      const platformConfig = PLATFORM_CONFIGS[selectedPlatform];
      const dataUrl = await generatePostImage(renderRef.current, platformConfig.width, platformConfig.height);
      const filename = `${profile?.displayName || 'post'}-${selectedTemplate}-${selectedPlatform}.png`.replace(/\s+/g, '-').toLowerCase();
      downloadImage(dataUrl, filename);

      setUsage({ current: data.data.current, limit: data.data.limit ?? Infinity });
      showToast({ title: 'Downloaded!', description: 'Your social media post has been saved', variant: 'success' });
    } catch {
      showToast({ title: 'Error', description: 'Failed to generate image. Try again.', variant: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const isAtLimit = usage.limit !== null && usage.current >= usage.limit;
  const platformConfig = selectedPlatform ? PLATFORM_CONFIGS[selectedPlatform] : null;
  const postData = buildPostData();

  // Preview scale
  const previewMaxWidth = 400;
  const previewScale = platformConfig ? Math.min(previewMaxWidth / platformConfig.width, 1) : 1;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-primary">Social Posts</h1>
        <p className="text-muted-foreground">Loading your data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Social Posts</h1>
          <p className="text-muted-foreground mt-2">
            Create branded posts for social media ({usage.current}/{usage.limit === Infinity ? '∞' : usage.limit} this month)
          </p>
        </div>
      </div>

      {isAtLimit && (
        <UpgradeBanner feature="social posts this month" currentUsage={usage.current} limit={typeof usage.limit === 'number' ? usage.limit : 0} />
      )}

      {/* Steps navigation */}
      <div className="flex gap-2 flex-wrap">
        {(['template', 'platform', 'customize', 'preview'] as Step[]).map((s, i) => (
          <Badge
            key={s}
            variant={step === s ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => {
              if (s === 'template') setStep(s);
              if (s === 'platform' && selectedTemplate) setStep(s);
              if (s === 'customize' && selectedPlatform) setStep(s);
              if (s === 'preview' && selectedPlatform) setStep(s);
            }}
          >
            {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
          </Badge>
        ))}
      </div>

      {/* Step 1: Template Selection */}
      {step === 'template' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.entries(TEMPLATE_CONFIGS) as [TemplateType, typeof TEMPLATE_CONFIGS[TemplateType]][]).map(([key, config]) => {
            const disabled = config.requiredData.some(d => !hasData(d));
            return (
              <Card
                key={key}
                className={`cursor-pointer transition-all ${disabled ? 'opacity-40 pointer-events-none' : 'hover:shadow-lg hover:border-primary'} ${selectedTemplate === key ? 'border-primary ring-2 ring-primary/20' : ''}`}
                onClick={() => { setSelectedTemplate(key); setStep('platform'); }}
              >
                <CardHeader>
                  <div className="text-3xl mb-2">{config.icon}</div>
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                {disabled && (
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Requires: {config.requiredData.join(', ')}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Step 2: Platform Selection */}
      {step === 'platform' && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep('template')} className="mb-4">
            ← Back to Templates
          </Button>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.entries(PLATFORM_CONFIGS) as [SocialPlatform, PlatformConfig][]).map(([key, config]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary ${selectedPlatform === key ? 'border-primary ring-2 ring-primary/20' : ''}`}
                onClick={() => { setSelectedPlatform(key); setStep('customize'); }}
              >
                <CardContent className="pt-6 text-center">
                  <p className="font-medium">{config.name}</p>
                  <p className="text-sm text-muted-foreground">{config.width}x{config.height}</p>
                  <Badge variant="outline" className="mt-2">{config.aspectRatio}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Customize */}
      {step === 'customize' && selectedTemplate && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep('platform')} className="mb-4">
            ← Back to Platforms
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Post</CardTitle>
              <CardDescription>
                {TEMPLATE_CONFIGS[selectedTemplate].name} for {platformConfig?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Portfolio Showcase: Image picker */}
              {selectedTemplate === 'portfolio-showcase' && (
                <div className="space-y-2">
                  <Label>Select a Portfolio Image</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {portfolio.map((img) => (
                      <div
                        key={img.id}
                        className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all ${selectedImageUrl === img.imageUrl ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'}`}
                        onClick={() => setSelectedImageUrl(img.imageUrl)}
                      >
                        <img src={img.imageUrl} alt={img.caption || ''} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Spotlight: Service picker */}
              {selectedTemplate === 'service-spotlight' && (
                <div className="space-y-2">
                  <Label htmlFor="service-select">Select a Service</Label>
                  <select
                    id="service-select"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Choose a service...</option>
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} — ${(svc.priceCents / 100).toFixed(0)} ({svc.durationMinutes} min)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Review Testimonial: Review picker */}
              {selectedTemplate === 'review-testimonial' && (
                <div className="space-y-2">
                  <Label htmlFor="review-select">Select a Review</Label>
                  <select
                    id="review-select"
                    value={selectedReviewId}
                    onChange={(e) => setSelectedReviewId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Choose a review...</option>
                    {reviews.map((rev) => {
                      const reviewer = rev.user || rev.client;
                      const name = reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Client';
                      return (
                        <option key={rev.id} value={rev.id}>
                          {'★'.repeat(rev.rating)} — {name}: {(rev.comment || '').slice(0, 50)}...
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* In Town: Travel date picker */}
              {selectedTemplate === 'in-town' && (
                <div className="space-y-2">
                  <Label htmlFor="travel-select">Select a Travel Date</Label>
                  <select
                    id="travel-select"
                    value={selectedTravelId}
                    onChange={(e) => setSelectedTravelId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Choose a trip...</option>
                    {travelDates.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.city}, {trip.state} — {new Date(trip.startDate).toLocaleDateString()} to {new Date(trip.endDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* New Client Special: Promo text */}
              {selectedTemplate === 'new-client-special' && (
                <div className="space-y-2">
                  <Label htmlFor="promo-text">Promo Text</Label>
                  <Textarea
                    id="promo-text"
                    value={promoText}
                    onChange={(e) => setPromoText(e.target.value)}
                    placeholder="e.g., 20% off your first fade!"
                    rows={3}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">{promoText.length}/100</p>
                </div>
              )}

              <Button onClick={() => setStep('preview')}>
                Preview Post →
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Preview + Generate */}
      {step === 'preview' && selectedTemplate && platformConfig && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep('customize')} className="mb-4">
            ← Back to Customize
          </Button>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>{platformConfig.name} — {platformConfig.width}x{platformConfig.height}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border" style={{ maxWidth: previewMaxWidth }}>
                  <div
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                      width: platformConfig.width,
                      height: platformConfig.height,
                    }}
                  >
                    {renderTemplate(postData, platformConfig)}
                  </div>
                </div>
                <div style={{ height: platformConfig.height * previewScale }} />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generate & Download</CardTitle>
                  <CardDescription>
                    Your image will be saved as a {platformConfig.width}x{platformConfig.height} PNG
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tier === 'starter' && (
                    <p className="text-xs text-muted-foreground">
                      Starter plan includes a watermark. Upgrade to Professional to remove it.
                    </p>
                  )}
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || isAtLimit}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? 'Generating...' : 'Download PNG'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => { setStep('template'); setSelectedTemplate(null); setSelectedPlatform(null); }}>
                    Create Another Post
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2">Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use high-quality portfolio images for best results</li>
                    <li>• Instagram Stories/Reels use 9:16 vertical format</li>
                    <li>• X/Twitter and Facebook use landscape format</li>
                    <li>• Pinterest performs best with tall 2:3 images</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Hidden full-size render container */}
      {selectedTemplate && platformConfig && (
        <div
          ref={renderRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: platformConfig.width,
            height: platformConfig.height,
            overflow: 'hidden',
            zIndex: -1,
          }}
        >
          {renderTemplate(postData, platformConfig)}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { generatePostImage, downloadImage, imageUrlToDataUrl } from '@/lib/social-image';
import { STOCK_PHOTOS, type StockPhoto } from '@/lib/stock-photos';
import { generateCaptionData } from '@/lib/social-captions';
import {
  PLATFORM_CONFIGS,
  TEMPLATE_CONFIGS,
  type SocialPlatform,
  type TemplateType,
  type MarketingPostData,
  type PlatformConfig,
} from '@/types/social';

import { JoinRegistry } from '@/components/social/templates/join-registry';
import { BarberFeatures } from '@/components/social/templates/barber-features';
import { FindYourBarber } from '@/components/social/templates/find-your-barber';
import { WhyChooseUs } from '@/components/social/templates/why-choose-us';
import { CustomAnnouncement } from '@/components/social/templates/custom-announcement';

type Step = 'template' | 'photo' | 'platform' | 'customize' | 'preview';

export default function AdminSocialPage() {
  const { showToast } = useToast();
  const renderRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [generating, setGenerating] = useState(false);
  const [photoFilter, setPhotoFilter] = useState<StockPhoto['category'] | 'all'>('all');

  const [postData, setPostData] = useState<MarketingPostData>({
    headline: '',
    subheadline: '',
    ctaText: '',
    backgroundImageUrl: '',
  });

  const getDefaultData = (template: TemplateType): MarketingPostData => {
    switch (template) {
      case 'join-registry':
        return { headline: 'GROW YOUR CLIENT BASE', subheadline: 'Get verified. Showcase your work. Connect with clients who are looking for you.', ctaText: 'JOIN FREE', backgroundImageUrl: '' };
      case 'barber-features':
        return { headline: 'BUILT FOR BARBERS', subheadline: '', ctaText: 'START FREE', backgroundImageUrl: '' };
      case 'find-your-barber':
        return { headline: 'FIND YOUR BARBER', subheadline: 'Verified. Rated. Ready to cut.', ctaText: 'SEARCH FREE', backgroundImageUrl: '' };
      case 'why-choose-us':
        return { headline: 'TRUSTED BY CLIENTS EVERYWHERE', subheadline: '', ctaText: 'FIND A BARBER', backgroundImageUrl: '' };
      case 'custom-announcement':
        return { headline: '', subheadline: '', ctaText: '', backgroundImageUrl: '' };
    }
  };

  const renderTemplate = (data: MarketingPostData, platform: PlatformConfig) => {
    switch (selectedTemplate) {
      case 'join-registry': return <JoinRegistry data={data} platform={platform} />;
      case 'barber-features': return <BarberFeatures data={data} platform={platform} />;
      case 'find-your-barber': return <FindYourBarber data={data} platform={platform} />;
      case 'why-choose-us': return <WhyChooseUs data={data} platform={platform} />;
      case 'custom-announcement': return <CustomAnnouncement data={data} platform={platform} />;
      default: return null;
    }
  };

  const handleSelectTemplate = (template: TemplateType) => {
    setSelectedTemplate(template);
    setPostData(getDefaultData(template));
    setStep('photo');
  };

  const [photoLoading, setPhotoLoading] = useState(false);

  const handleSelectPhoto = async (url: string) => {
    setPhotoLoading(true);
    try {
      // Convert to data URL to avoid CORS issues with html-to-image
      const dataUrl = await imageUrlToDataUrl(url);
      setPostData({ ...postData, backgroundImageUrl: dataUrl });
      setStep('platform');
    } catch {
      showToast({ title: 'Error', description: 'Failed to load photo. Try another.', variant: 'error' });
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!renderRef.current || !selectedTemplate || !selectedPlatform) return;

    setGenerating(true);
    try {
      const platformConfig = PLATFORM_CONFIGS[selectedPlatform];
      const dataUrl = await generatePostImage(renderRef.current, platformConfig.width, platformConfig.height);
      const filename = `cbr-${selectedTemplate}-${selectedPlatform}.png`;
      downloadImage(dataUrl, filename);
      showToast({ title: 'Downloaded!', description: `${platformConfig.name} post saved`, variant: 'success' });
    } catch {
      showToast({ title: 'Error', description: 'Failed to generate image. Make sure the background image has loaded.', variant: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const platformConfig = selectedPlatform ? PLATFORM_CONFIGS[selectedPlatform] : null;
  const previewMaxWidth = 420;
  const previewScale = platformConfig ? Math.min(previewMaxWidth / platformConfig.width, 1) : 1;

  const filteredPhotos = photoFilter === 'all'
    ? STOCK_PHOTOS
    : STOCK_PHOTOS.filter((p) => p.category === photoFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-destructive">Social Media Posts</h1>
        <p className="text-muted-foreground mt-2">
          Create scroll-stopping posts to attract barbers and clients
        </p>
      </div>

      {/* Step nav */}
      <div className="flex gap-2 flex-wrap">
        {(['template', 'photo', 'platform', 'customize', 'preview'] as Step[]).map((s, i) => (
          <Badge
            key={s}
            variant={step === s ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => {
              if (s === 'template') setStep(s);
              if (s === 'photo' && selectedTemplate) setStep(s);
              if (s === 'platform' && postData.backgroundImageUrl) setStep(s);
              if (s === 'customize' && selectedPlatform) setStep(s);
              if (s === 'preview' && selectedPlatform) setStep(s);
            }}
          >
            {i + 1}. {s === 'photo' ? 'Photo' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Badge>
        ))}
      </div>

      {/* Step 1: Template */}
      {step === 'template' && (
        <div>
          <h3 className="font-medium mb-3 text-muted-foreground">Recruit Barbers</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {(Object.entries(TEMPLATE_CONFIGS) as [TemplateType, typeof TEMPLATE_CONFIGS[TemplateType]][])
              .filter(([, c]) => c.audience === 'barbers')
              .map(([key, config]) => (
                <Card key={key} className="cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => handleSelectTemplate(key)}>
                  <CardHeader>
                    <div className="text-3xl mb-2">{config.icon}</div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
          </div>

          <h3 className="font-medium mb-3 text-muted-foreground">Attract Clients</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {(Object.entries(TEMPLATE_CONFIGS) as [TemplateType, typeof TEMPLATE_CONFIGS[TemplateType]][])
              .filter(([, c]) => c.audience === 'clients')
              .map(([key, config]) => (
                <Card key={key} className="cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => handleSelectTemplate(key)}>
                  <CardHeader>
                    <div className="text-3xl mb-2">{config.icon}</div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
          </div>

          <h3 className="font-medium mb-3 text-muted-foreground">General</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(TEMPLATE_CONFIGS) as [TemplateType, typeof TEMPLATE_CONFIGS[TemplateType]][])
              .filter(([, c]) => c.audience === 'general')
              .map(([key, config]) => (
                <Card key={key} className="cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => handleSelectTemplate(key)}>
                  <CardHeader>
                    <div className="text-3xl mb-2">{config.icon}</div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Step 2: Photo Selection */}
      {step === 'photo' && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep('template')} className="mb-4">← Back</Button>

          <Card>
            <CardHeader>
              <CardTitle>Choose a Background Photo</CardTitle>
              <CardDescription>Select from our royalty-free barbershop photo library</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Category filter */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {(['all', 'action', 'tools', 'interior', 'result'] as const).map((cat) => (
                  <Button
                    key={cat}
                    variant={photoFilter === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPhotoFilter(cat)}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>

              {photoLoading && (
                <div className="text-center py-4 text-muted-foreground">Loading photo...</div>
              )}

              {/* Photo grid */}
              <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 ${photoLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 ${postData.backgroundImageUrl === photo.url ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}`}
                    onClick={() => handleSelectPhoto(photo.url)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-xs text-white truncate">{photo.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skip photo option */}
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" onClick={() => { setPostData({ ...postData, backgroundImageUrl: '' }); setStep('platform'); }}>
                  Skip — use solid background
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Platform */}
      {step === 'platform' && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep('photo')} className="mb-4">← Back</Button>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.entries(PLATFORM_CONFIGS) as [SocialPlatform, PlatformConfig][]).map(([key, config]) => (
              <Card
                key={key}
                className={`cursor-pointer hover:shadow-lg hover:border-primary transition-all ${selectedPlatform === key ? 'border-primary ring-2 ring-primary/20' : ''}`}
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

      {/* Step 4: Customize */}
      {step === 'customize' && selectedTemplate && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep('platform')} className="mb-4">← Back</Button>
          <Card>
            <CardHeader>
              <CardTitle>Customize Text</CardTitle>
              <CardDescription>Edit the copy — keep it short and punchy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Headline (big text)</Label>
                <Input
                  id="headline"
                  value={postData.headline}
                  onChange={(e) => setPostData({ ...postData, headline: e.target.value })}
                  placeholder="FIND YOUR BARBER"
                  maxLength={40}
                />
                <p className="text-xs text-muted-foreground">Short and bold. {postData.headline?.length || 0}/40</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subheadline">Subheadline (optional)</Label>
                <Textarea
                  id="subheadline"
                  value={postData.subheadline}
                  onChange={(e) => setPostData({ ...postData, subheadline: e.target.value })}
                  placeholder="Supporting text"
                  rows={2}
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta">CTA Button (optional)</Label>
                <Input
                  id="cta"
                  value={postData.ctaText}
                  onChange={(e) => setPostData({ ...postData, ctaText: e.target.value })}
                  placeholder="JOIN FREE"
                  maxLength={20}
                />
              </div>
              <Button onClick={() => setStep('preview')}>Preview →</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 5: Preview + Download */}
      {step === 'preview' && selectedTemplate && platformConfig && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep('customize')} className="mb-4">← Back</Button>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>{platformConfig.name} — {platformConfig.width}x{platformConfig.height}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border bg-muted" style={{ maxWidth: previewMaxWidth }}>
                  <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: platformConfig.width, height: platformConfig.height }}>
                    {renderTemplate(postData, platformConfig)}
                  </div>
                </div>
                <div style={{ height: platformConfig.height * previewScale }} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Download</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={handleGenerate} disabled={generating} className="w-full" size="lg">
                    {generating ? 'Generating...' : 'Download PNG'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => { setStep('template'); setSelectedTemplate(null); setSelectedPlatform(null); }}>
                    Create Another
                  </Button>
                </CardContent>
              </Card>

              {/* Caption & Hashtags */}
              {selectedTemplate && selectedPlatform && (() => {
                const captionData = generateCaptionData(selectedTemplate, selectedPlatform);
                const pConfig = PLATFORM_CONFIGS[selectedPlatform];
                const fullText = captionData.caption + '\n\n' + captionData.hashtags.join(' ');
                const isOverLimit = fullText.length > pConfig.captionLimit;
                const captionOnlyOver = captionData.caption.length > pConfig.captionLimit;

                return (
                  <>
                    {/* Character limit warning */}
                    <Card className={isOverLimit ? 'border-destructive bg-destructive/5' : 'border-green-300 bg-green-50/30'}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{isOverLimit ? '⚠️' : '✅'}</span>
                            <span className="text-sm font-medium">
                              {pConfig.name}: {pConfig.captionLimit.toLocaleString()} char limit
                            </span>
                          </div>
                          <div className={`text-sm font-mono ${isOverLimit ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                            {fullText.length.toLocaleString()} / {pConfig.captionLimit.toLocaleString()}
                          </div>
                        </div>
                        {isOverLimit && (
                          <p className="text-xs text-destructive mt-1">
                            {captionOnlyOver
                              ? `Caption alone is ${captionData.caption.length - pConfig.captionLimit} chars over. Shorten the caption.`
                              : 'Caption + hashtags exceed the limit. Post hashtags in a separate comment instead.'}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{pConfig.hashtagTip}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Caption</CardTitle>
                        <CardDescription>{captionData.caption.length} chars</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="relative">
                          <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md border max-h-48 overflow-y-auto">{captionData.caption}</pre>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              navigator.clipboard.writeText(captionData.caption);
                              showToast({ title: 'Copied!', description: 'Caption copied to clipboard', variant: 'success' });
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Hashtags</CardTitle>
                        <CardDescription>
                          {captionData.hashtags.length} tags · {captionData.hashtags.join(' ').length} chars
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {captionData.hashtags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            navigator.clipboard.writeText(captionData.hashtags.join(' '));
                            showToast({ title: 'Copied!', description: 'All hashtags copied', variant: 'success' });
                          }}
                        >
                          Copy All Hashtags
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/30">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">💡</span>
                          <div>
                            <p className="text-sm font-medium">Platform Tip</p>
                            <p className="text-sm text-muted-foreground mt-1">{captionData.platformTip}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Hidden render container */}
      {selectedTemplate && platformConfig && (
        <div ref={renderRef} style={{ position: 'fixed', top: 0, left: 0, width: platformConfig.width, height: platformConfig.height, overflow: 'hidden', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
          {renderTemplate(postData, platformConfig)}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { generatePostImage, downloadImage } from '@/lib/social-image';
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

type Step = 'template' | 'platform' | 'customize' | 'preview';

export default function AdminSocialPage() {
  const { showToast } = useToast();
  const renderRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [generating, setGenerating] = useState(false);

  const [postData, setPostData] = useState<MarketingPostData>({
    headline: '',
    subheadline: '',
    ctaText: '',
  });

  const getDefaultData = (template: TemplateType): MarketingPostData => {
    switch (template) {
      case 'join-registry':
        return { headline: 'Grow Your Client Base', subheadline: 'Get verified. Showcase your work. Connect with clients actively looking for skilled barbers.', ctaText: 'JOIN FREE TODAY' };
      case 'barber-features':
        return { headline: 'Everything You Need to Grow', subheadline: '', ctaText: 'START FREE' };
      case 'find-your-barber':
        return { headline: 'Find Your Perfect Barber', subheadline: 'Discover verified, top-rated barbers in your area. Browse portfolios, read reviews, and book with confidence.', ctaText: 'SEARCH NOW — FREE' };
      case 'why-choose-us':
        return { headline: 'Why Clients Choose Us', subheadline: '', ctaText: 'FIND A BARBER' };
      case 'custom-announcement':
        return { headline: '', subheadline: '', ctaText: '' };
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
    setStep('platform');
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
      showToast({ title: 'Error', description: 'Failed to generate image', variant: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const platformConfig = selectedPlatform ? PLATFORM_CONFIGS[selectedPlatform] : null;
  const previewMaxWidth = 400;
  const previewScale = platformConfig ? Math.min(previewMaxWidth / platformConfig.width, 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-destructive">Social Media Posts</h1>
        <p className="text-muted-foreground mt-2">
          Create branded posts to attract barbers and clients to the platform
        </p>
      </div>

      {/* Step nav */}
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

      {/* Step 1: Template */}
      {step === 'template' && (
        <div>
          <h3 className="font-medium mb-3 text-muted-foreground">For Barbers</h3>
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

          <h3 className="font-medium mb-3 text-muted-foreground">For Clients</h3>
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

      {/* Step 2: Platform */}
      {step === 'platform' && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep('template')} className="mb-4">← Back</Button>
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

      {/* Step 3: Customize */}
      {step === 'customize' && selectedTemplate && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStep('platform')} className="mb-4">← Back</Button>
          <Card>
            <CardHeader>
              <CardTitle>Customize Text</CardTitle>
              <CardDescription>Edit the copy for your {TEMPLATE_CONFIGS[selectedTemplate].name} post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={postData.headline}
                  onChange={(e) => setPostData({ ...postData, headline: e.target.value })}
                  placeholder="Main headline text"
                  maxLength={60}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subheadline">Subheadline (optional)</Label>
                <Textarea
                  id="subheadline"
                  value={postData.subheadline}
                  onChange={(e) => setPostData({ ...postData, subheadline: e.target.value })}
                  placeholder="Supporting text"
                  rows={2}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta">CTA Button Text (optional)</Label>
                <Input
                  id="cta"
                  value={postData.ctaText}
                  onChange={(e) => setPostData({ ...postData, ctaText: e.target.value })}
                  placeholder="e.g., JOIN FREE TODAY"
                  maxLength={30}
                />
              </div>
              <Button onClick={() => setStep('preview')}>Preview Post →</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Preview + Download */}
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
                <div className="overflow-hidden rounded-lg border" style={{ maxWidth: previewMaxWidth }}>
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
                  <CardDescription>Save as {platformConfig.width}x{platformConfig.height} PNG</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={handleGenerate} disabled={generating} className="w-full" size="lg">
                    {generating ? 'Generating...' : 'Download PNG'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => { setStep('template'); setSelectedTemplate(null); setSelectedPlatform(null); }}>
                    Create Another Post
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground space-y-1">
                  <p>• Instagram Stories/Reels/TikTok: 9:16 vertical</p>
                  <p>• X/Twitter & Facebook: landscape format</p>
                  <p>• Pinterest: tall 2:3 format</p>
                  <p>• Instagram Post: 1:1 square</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Hidden render container */}
      {selectedTemplate && platformConfig && (
        <div ref={renderRef} style={{ position: 'fixed', left: '-9999px', top: 0, width: platformConfig.width, height: platformConfig.height, overflow: 'hidden', zIndex: -1 }}>
          {renderTemplate(postData, platformConfig)}
        </div>
      )}
    </div>
  );
}

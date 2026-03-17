import React from 'react';
import type { MarketingPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: MarketingPostData;
  platform: PlatformConfig;
}

export function JoinRegistry({ data, platform }: Props) {
  const { width, height } = platform;

  return (
    <BaseLayout width={width} height={height} showWatermark={false}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(160deg, #1A1A2E 0%, #16213E 40%, #0F3460 100%)' }} />

      {/* Gold accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: width * 0.01, backgroundColor: '#C9A96E' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: `${width * 0.08}px`, textAlign: 'center' }}>

        {/* Scissors icon */}
        <div style={{ fontSize: width * 0.08, marginBottom: height * 0.02 }}>✂️</div>

        {/* Brand */}
        <div style={{ fontSize: width * 0.022, color: '#C9A96E', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: height * 0.03 }}>
          Concierge Barber Registry
        </div>

        {/* Headline */}
        <div style={{ fontSize: width * 0.065, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, maxWidth: '90%' }}>
          {data.headline || 'Grow Your Client Base'}
        </div>

        {/* Subheadline */}
        <div style={{ fontSize: width * 0.03, color: 'rgba(255,255,255,0.75)', marginTop: height * 0.02, lineHeight: 1.5, maxWidth: '80%' }}>
          {data.subheadline || 'Get verified. Showcase your work. Connect with clients actively looking for skilled barbers.'}
        </div>

        {/* Feature bullets */}
        <div style={{ marginTop: height * 0.035, display: 'flex', flexDirection: 'column', gap: height * 0.012, alignItems: 'center' }}>
          {['Verified Professional Badge', 'Portfolio & Reviews', 'Mobile & Travel Support'].map((feature) => (
            <div key={feature} style={{ fontSize: width * 0.024, color: '#C9A96E', display: 'flex', alignItems: 'center', gap: width * 0.015 }}>
              <span>✓</span> {feature}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: height * 0.04, padding: `${height * 0.015}px ${width * 0.08}px`, backgroundColor: '#C9A96E', color: '#1A1A2E', fontWeight: 700, fontSize: width * 0.03, borderRadius: width * 0.008 }}>
          {data.ctaText || 'JOIN FREE TODAY'}
        </div>

        {/* URL */}
        <div style={{ fontSize: width * 0.018, color: 'rgba(255,255,255,0.4)', marginTop: height * 0.015 }}>
          conciergebarberregistry.com
        </div>
      </div>
    </BaseLayout>
  );
}

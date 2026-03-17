import React from 'react';
import type { MarketingPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: MarketingPostData;
  platform: PlatformConfig;
}

export function FindYourBarber({ data, platform }: Props) {
  const { width, height } = platform;

  return (
    <BaseLayout width={width} height={height} showWatermark={false}>
      {/* Warm gradient background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, #C9A96E 0%, #8B6914 25%, #1A1A2E 55%)' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: `${width * 0.08}px`, textAlign: 'center' }}>

        {/* Search icon */}
        <div style={{ fontSize: width * 0.1, marginBottom: height * 0.02 }}>🔍</div>

        {/* Headline */}
        <div style={{ fontSize: width * 0.07, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {data.headline || 'Find Your Perfect Barber'}
        </div>

        {/* Subheadline */}
        <div style={{ fontSize: width * 0.03, color: 'rgba(255,255,255,0.85)', marginTop: height * 0.02, lineHeight: 1.5, maxWidth: '85%' }}>
          {data.subheadline || 'Discover verified, top-rated barbers in your area. Browse portfolios, read reviews, and book with confidence.'}
        </div>

        {/* Trust badges */}
        <div style={{ marginTop: height * 0.035, display: 'flex', gap: width * 0.04, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Licensed & Verified', 'Real Reviews', 'Mobile Barbers'].map((badge) => (
            <div key={badge} style={{ padding: `${height * 0.008}px ${width * 0.03}px`, border: '1px solid rgba(255,255,255,0.5)', borderRadius: width * 0.005, fontSize: width * 0.02, color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              {badge}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: height * 0.04, padding: `${height * 0.015}px ${width * 0.08}px`, backgroundColor: '#FFFFFF', color: '#1A1A2E', fontWeight: 700, fontSize: width * 0.03, borderRadius: width * 0.008 }}>
          {data.ctaText || 'SEARCH NOW — FREE'}
        </div>

        {/* Brand */}
        <div style={{ marginTop: height * 0.025 }}>
          <div style={{ fontSize: width * 0.022, color: '#C9A96E', letterSpacing: '2px' }}>
            CONCIERGE BARBER REGISTRY
          </div>
          <div style={{ fontSize: width * 0.016, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            conciergebarberregistry.com
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}

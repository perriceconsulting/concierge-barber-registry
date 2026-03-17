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
    <BaseLayout width={width} height={height} backgroundImageUrl={data.backgroundImageUrl} showWatermark={false}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: `${width * 0.08}px`, textAlign: 'center' }}>

        {/* Brand */}
        <div style={{ fontSize: width * 0.02, color: '#C9A96E', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: height * 0.02, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          Concierge Barber Registry
        </div>

        {/* Big headline */}
        <div style={{ fontSize: width * 0.09, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.05, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.7)' }}>
          {data.headline || 'FIND YOUR BARBER'}
        </div>

        {/* Subheadline */}
        <div style={{ fontSize: width * 0.03, color: 'rgba(255,255,255,0.9)', marginTop: height * 0.02, lineHeight: 1.5, maxWidth: '80%', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          {data.subheadline || 'Verified. Rated. Ready to cut.'}
        </div>

        {/* Trust badges */}
        <div style={{ marginTop: height * 0.03, display: 'flex', gap: width * 0.02, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Licensed', 'Reviewed', 'Mobile'].map((badge) => (
            <div key={badge} style={{ padding: `${height * 0.008}px ${width * 0.025}px`, backgroundColor: 'rgba(201,169,110,0.9)', color: '#1A1A2E', borderRadius: width * 0.004, fontSize: width * 0.022, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {badge}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: height * 0.035, padding: `${height * 0.018}px ${width * 0.1}px`, backgroundColor: '#FFFFFF', color: '#1A1A2E', fontWeight: 900, fontSize: width * 0.035, borderRadius: width * 0.008, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {data.ctaText || 'SEARCH FREE'}
        </div>

        <div style={{ fontSize: width * 0.016, color: 'rgba(255,255,255,0.4)', marginTop: height * 0.015 }}>
          conciergebarberregistry.com
        </div>
      </div>
    </BaseLayout>
  );
}

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
    <BaseLayout width={width} height={height} backgroundImageUrl={data.backgroundImageUrl} showWatermark={false}>
      {/* Content */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: `${width * 0.06}px` }}>

        {/* Brand tag */}
        <div style={{ fontSize: width * 0.02, color: '#C9A96E', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: height * 0.015 }}>
          Concierge Barber Registry
        </div>

        {/* Big headline */}
        <div style={{ fontSize: width * 0.085, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.05, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.7)' }}>
          {data.headline || 'GROW YOUR CLIENT BASE'}
        </div>

        {/* Subheadline */}
        <div style={{ fontSize: width * 0.03, color: 'rgba(255,255,255,0.85)', marginTop: height * 0.015, lineHeight: 1.5, maxWidth: '85%', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          {data.subheadline || 'Get verified. Showcase your work. Connect with clients who are looking for you.'}
        </div>

        {/* CTA */}
        <div style={{ marginTop: height * 0.025, display: 'inline-block' }}>
          <div style={{ display: 'inline-block', padding: `${height * 0.015}px ${width * 0.06}px`, backgroundColor: '#C9A96E', color: '#1A1A2E', fontWeight: 800, fontSize: width * 0.032, borderRadius: width * 0.006, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {data.ctaText || 'JOIN FREE'}
          </div>
        </div>

        <div style={{ fontSize: width * 0.016, color: 'rgba(255,255,255,0.4)', marginTop: height * 0.012 }}>
          conciergebarberregistry.com
        </div>
      </div>
    </BaseLayout>
  );
}

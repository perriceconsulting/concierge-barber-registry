import React from 'react';
import type { MarketingPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: MarketingPostData;
  platform: PlatformConfig;
}

export function CustomAnnouncement({ data, platform }: Props) {
  const { width, height } = platform;

  return (
    <BaseLayout width={width} height={height} backgroundImageUrl={data.backgroundImageUrl} showWatermark={false}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: `${width * 0.08}px`, textAlign: 'center' }}>

        {/* Brand */}
        <div style={{ fontSize: width * 0.02, color: '#C9A96E', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: height * 0.025, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          Concierge Barber Registry
        </div>

        {/* Headline */}
        <div style={{ fontSize: width * 0.075, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.7)', maxWidth: '90%' }}>
          {data.headline || 'YOUR HEADLINE'}
        </div>

        {/* Subheadline */}
        {data.subheadline && (
          <div style={{ fontSize: width * 0.03, color: 'rgba(255,255,255,0.85)', marginTop: height * 0.02, lineHeight: 1.5, maxWidth: '80%', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            {data.subheadline}
          </div>
        )}

        {/* CTA */}
        {data.ctaText && (
          <div style={{ marginTop: height * 0.03, padding: `${height * 0.015}px ${width * 0.07}px`, backgroundColor: '#C9A96E', color: '#1A1A2E', fontWeight: 800, fontSize: width * 0.032, borderRadius: width * 0.006, textTransform: 'uppercase' }}>
            {data.ctaText}
          </div>
        )}

        <div style={{ fontSize: width * 0.015, color: 'rgba(255,255,255,0.35)', marginTop: height * 0.02 }}>
          conciergebarberregistry.com
        </div>
      </div>
    </BaseLayout>
  );
}

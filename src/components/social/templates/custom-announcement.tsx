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
    <BaseLayout width={width} height={height} showWatermark={false}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, #1A1A2E 0%, #0F3460 50%, #1A1A2E 100%)' }} />

      {/* Gold frame */}
      <div style={{ position: 'absolute', top: width * 0.03, left: width * 0.03, right: width * 0.03, bottom: width * 0.03, border: `2px solid rgba(201, 169, 110, 0.4)`, borderRadius: width * 0.01 }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: `${width * 0.1}px`, textAlign: 'center' }}>

        {/* Brand */}
        <div style={{ fontSize: width * 0.02, color: '#C9A96E', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: height * 0.03 }}>
          Concierge Barber Registry
        </div>

        {/* Headline */}
        <div style={{ fontSize: width * 0.06, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25, maxWidth: '90%' }}>
          {data.headline || 'Your Headline Here'}
        </div>

        {/* Subheadline */}
        {data.subheadline && (
          <div style={{ fontSize: width * 0.028, color: 'rgba(255,255,255,0.75)', marginTop: height * 0.02, lineHeight: 1.5, maxWidth: '80%' }}>
            {data.subheadline}
          </div>
        )}

        {/* Divider */}
        <div style={{ width: width * 0.12, height: 2, backgroundColor: '#C9A96E', marginTop: height * 0.035, marginBottom: height * 0.025 }} />

        {/* CTA */}
        {data.ctaText && (
          <div style={{ padding: `${height * 0.012}px ${width * 0.06}px`, backgroundColor: '#C9A96E', color: '#1A1A2E', fontWeight: 700, fontSize: width * 0.028, borderRadius: width * 0.008 }}>
            {data.ctaText}
          </div>
        )}

        {/* URL */}
        <div style={{ fontSize: width * 0.016, color: 'rgba(255,255,255,0.35)', marginTop: height * 0.02 }}>
          conciergebarberregistry.com
        </div>
      </div>
    </BaseLayout>
  );
}

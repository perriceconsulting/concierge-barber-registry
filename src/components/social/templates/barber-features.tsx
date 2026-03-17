import React from 'react';
import type { MarketingPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: MarketingPostData;
  platform: PlatformConfig;
}

const FEATURES = [
  { icon: '📸', text: 'Portfolio Gallery' },
  { icon: '⭐', text: 'Client Reviews' },
  { icon: '✈️', text: 'Travel Bookings' },
  { icon: '🚗', text: 'Mobile Service' },
  { icon: '🛡️', text: 'Verified Badge' },
  { icon: '📱', text: 'Marketing Tools' },
];

export function BarberFeatures({ data, platform }: Props) {
  const { width, height } = platform;

  return (
    <BaseLayout width={width} height={height} backgroundImageUrl={data.backgroundImageUrl} showWatermark={false}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${width * 0.06}px` }}>

        {/* Brand */}
        <div style={{ fontSize: width * 0.018, color: '#C9A96E', letterSpacing: '3px', textTransform: 'uppercase', textAlign: 'center', marginBottom: height * 0.015 }}>
          Concierge Barber Registry
        </div>

        {/* Headline */}
        <div style={{ fontSize: width * 0.065, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1, textAlign: 'center', textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.7)', marginBottom: height * 0.03 }}>
          {data.headline || 'BUILT FOR BARBERS'}
        </div>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${height * 0.018}px`, padding: `0 ${width * 0.04}px` }}>
          {FEATURES.map((f) => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: width * 0.02, backgroundColor: 'rgba(0,0,0,0.4)', padding: `${height * 0.012}px ${width * 0.025}px`, borderRadius: width * 0.008, borderLeft: `3px solid #C9A96E` }}>
              <span style={{ fontSize: width * 0.035 }}>{f.icon}</span>
              <span style={{ fontSize: width * 0.025, fontWeight: 600, color: '#FFFFFF' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: height * 0.03 }}>
          <div style={{ display: 'inline-block', padding: `${height * 0.015}px ${width * 0.08}px`, backgroundColor: '#C9A96E', color: '#1A1A2E', fontWeight: 800, fontSize: width * 0.03, borderRadius: width * 0.006, textTransform: 'uppercase' }}>
            {data.ctaText || 'START FREE'}
          </div>
          <div style={{ fontSize: width * 0.015, color: 'rgba(255,255,255,0.4)', marginTop: height * 0.01 }}>
            conciergebarberregistry.com
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}

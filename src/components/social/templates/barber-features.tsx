import React from 'react';
import type { MarketingPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: MarketingPostData;
  platform: PlatformConfig;
}

const FEATURES = [
  { icon: '📸', title: 'Portfolio Gallery', desc: 'Showcase your best work' },
  { icon: '⭐', title: 'Client Reviews', desc: 'Build trust with authentic ratings' },
  { icon: '✈️', title: 'Travel Dates', desc: 'Let clients know when you visit their city' },
  { icon: '🚗', title: 'Mobile Service', desc: 'Reach clients who want house calls' },
  { icon: '📱', title: 'Social Tools', desc: 'Built-in marketing content creator' },
  { icon: '🛡️', title: 'Verified Badge', desc: 'Stand out with license verification' },
];

export function BarberFeatures({ data, platform }: Props) {
  const { width, height } = platform;
  const isWide = width > height;
  const featureFontSize = isWide ? width * 0.022 : width * 0.028;
  const descFontSize = isWide ? width * 0.016 : width * 0.02;

  return (
    <BaseLayout width={width} height={height} showWatermark={false}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at top, #1e2a4a 0%, #1A1A2E 70%)' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${width * 0.06}px` }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: height * 0.03 }}>
          <div style={{ fontSize: width * 0.02, color: '#C9A96E', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Concierge Barber Registry
          </div>
          <div style={{ fontSize: width * 0.05, fontWeight: 800, color: '#FFFFFF', marginTop: height * 0.01 }}>
            {data.headline || 'Everything You Need to Grow'}
          </div>
        </div>

        {/* Features grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${height * 0.02}px ${width * 0.04}px`, padding: `0 ${width * 0.02}px` }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: width * 0.02 }}>
              <div style={{ fontSize: featureFontSize * 1.3, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: featureFontSize, fontWeight: 600, color: '#C9A96E' }}>{f.title}</div>
                <div style={{ fontSize: descFontSize, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: height * 0.035 }}>
          <div style={{ display: 'inline-block', padding: `${height * 0.012}px ${width * 0.06}px`, backgroundColor: '#C9A96E', color: '#1A1A2E', fontWeight: 700, fontSize: width * 0.025, borderRadius: width * 0.006 }}>
            {data.ctaText || 'START FREE'}
          </div>
          <div style={{ fontSize: width * 0.016, color: 'rgba(255,255,255,0.35)', marginTop: height * 0.01 }}>
            conciergebarberregistry.com
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}

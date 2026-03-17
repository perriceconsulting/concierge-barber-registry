import React from 'react';
import type { MarketingPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: MarketingPostData;
  platform: PlatformConfig;
}

const REASONS = [
  { icon: '🛡️', title: 'Verified Licenses', desc: 'Every barber is license-verified by our team' },
  { icon: '⭐', title: 'Authentic Reviews', desc: 'Real feedback from real clients' },
  { icon: '📸', title: 'See Their Work', desc: 'Browse portfolios before you book' },
  { icon: '🚗', title: 'Mobile & Travel', desc: 'Find barbers who come to you' },
];

export function WhyChooseUs({ data, platform }: Props) {
  const { width, height } = platform;
  const isWide = width > height;

  return (
    <BaseLayout width={width} height={height} showWatermark={false}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)' }} />

      {/* Gold accent lines */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: width * 0.008, backgroundColor: '#C9A96E' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: width * 0.008, backgroundColor: '#C9A96E' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${width * 0.06}px ${width * 0.08}px`, textAlign: 'center' }}>

        {/* Brand */}
        <div style={{ fontSize: width * 0.018, color: '#C9A96E', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: height * 0.015 }}>
          Concierge Barber Registry
        </div>

        {/* Headline */}
        <div style={{ fontSize: width * 0.055, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
          {data.headline || 'Why Clients Choose Us'}
        </div>

        <div style={{ width: width * 0.15, height: 2, backgroundColor: '#C9A96E', margin: `${height * 0.025}px auto` }} />

        {/* Reasons */}
        <div style={{ display: 'flex', flexDirection: isWide ? 'row' : 'column', gap: isWide ? width * 0.03 : height * 0.02, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          {REASONS.map((r) => (
            <div key={r.title} style={{ flex: isWide ? 1 : undefined, maxWidth: isWide ? '25%' : '80%' }}>
              <div style={{ fontSize: width * 0.05 }}>{r.icon}</div>
              <div style={{ fontSize: width * 0.024, fontWeight: 600, color: '#C9A96E', marginTop: height * 0.005 }}>{r.title}</div>
              <div style={{ fontSize: width * 0.018, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: height * 0.035, display: 'inline-block' }}>
          <div style={{ display: 'inline-block', padding: `${height * 0.012}px ${width * 0.06}px`, backgroundColor: '#C9A96E', color: '#1A1A2E', fontWeight: 700, fontSize: width * 0.025, borderRadius: width * 0.006 }}>
            {data.ctaText || 'FIND A BARBER'}
          </div>
        </div>

        <div style={{ fontSize: width * 0.015, color: 'rgba(255,255,255,0.35)', marginTop: height * 0.015 }}>
          100% Free for Clients
        </div>
      </div>
    </BaseLayout>
  );
}

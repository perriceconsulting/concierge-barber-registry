import React from 'react';
import type { MarketingPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: MarketingPostData;
  platform: PlatformConfig;
}

export function WhyChooseUs({ data, platform }: Props) {
  const { width, height } = platform;

  return (
    <BaseLayout width={width} height={height} backgroundImageUrl={data.backgroundImageUrl} showWatermark={false}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: `${width * 0.06}px` }}>

        {/* Headline */}
        <div style={{ fontSize: width * 0.075, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.05, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.7)' }}>
          {data.headline || 'TRUSTED BY CLIENTS EVERYWHERE'}
        </div>

        {/* Trust points */}
        <div style={{ marginTop: height * 0.02, display: 'flex', flexDirection: 'column', gap: height * 0.01 }}>
          {[
            '✓ Every barber is license-verified',
            '✓ Real reviews from real clients',
            '✓ Browse portfolios before you book',
          ].map((point) => (
            <div key={point} style={{ fontSize: width * 0.028, color: '#C9A96E', fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {point}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: height * 0.025, display: 'inline-block' }}>
          <div style={{ display: 'inline-block', padding: `${height * 0.015}px ${width * 0.06}px`, backgroundColor: '#C9A96E', color: '#1A1A2E', fontWeight: 800, fontSize: width * 0.032, borderRadius: width * 0.006, textTransform: 'uppercase' }}>
            {data.ctaText || 'FIND A BARBER'}
          </div>
        </div>

        {/* Brand */}
        <div style={{ marginTop: height * 0.015 }}>
          <div style={{ fontSize: width * 0.018, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px' }}>
            CONCIERGE BARBER REGISTRY
          </div>
          <div style={{ fontSize: width * 0.014, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
            100% Free for Clients · conciergebarberregistry.com
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}

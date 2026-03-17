import React from 'react';
import type { SocialPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: SocialPostData;
  platform: PlatformConfig;
}

export function PortfolioShowcase({ data, platform }: Props) {
  const { width, height } = platform;
  const showWatermark = data.tier === 'starter';

  return (
    <BaseLayout width={width} height={height} showWatermark={showWatermark}>
      {/* Background Image */}
      {data.portfolioImageUrl && (
        <img
          src={data.portfolioImageUrl}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(26, 26, 46, 0.95) 0%, rgba(26, 26, 46, 0.6) 50%, transparent 100%)',
        }}
      />

      {/* Top Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: `${width * 0.03}px ${width * 0.04}px`,
          background: 'linear-gradient(to bottom, rgba(26, 26, 46, 0.7), transparent)',
        }}
      >
        <div style={{ fontSize: width * 0.022, color: '#C9A96E', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Concierge Barber Registry
        </div>
      </div>

      {/* Bottom Content */}
      <div
        style={{
          position: 'absolute',
          bottom: showWatermark ? height * 0.06 : height * 0.04,
          left: width * 0.04,
          right: width * 0.04,
        }}
      >
        <div style={{ fontSize: width * 0.06, fontWeight: 700, color: '#C9A96E', lineHeight: 1.2 }}>
          {data.barberName}
        </div>
        {data.tagline && (
          <div style={{ fontSize: width * 0.028, color: 'rgba(255,255,255,0.85)', marginTop: height * 0.008, fontStyle: 'italic' }}>
            {data.tagline}
          </div>
        )}
        <div style={{ fontSize: width * 0.024, color: 'rgba(255,255,255,0.7)', marginTop: height * 0.012 }}>
          📍 {data.city}, {data.state}
        </div>
        {data.instagramHandle && (
          <div style={{ fontSize: width * 0.022, color: '#C9A96E', marginTop: height * 0.008 }}>
            @{data.instagramHandle.replace('@', '')}
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            marginTop: height * 0.02,
            display: 'inline-block',
            padding: `${height * 0.012}px ${width * 0.05}px`,
            backgroundColor: '#C9A96E',
            color: '#1A1A2E',
            fontWeight: 700,
            fontSize: width * 0.026,
            borderRadius: width * 0.008,
          }}
        >
          BOOK NOW
        </div>
      </div>
    </BaseLayout>
  );
}

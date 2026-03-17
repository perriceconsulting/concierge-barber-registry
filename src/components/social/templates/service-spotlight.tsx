import React from 'react';
import type { SocialPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: SocialPostData;
  platform: PlatformConfig;
}

export function ServiceSpotlight({ data, platform }: Props) {
  const { width, height } = platform;
  const showWatermark = data.tier === 'starter';
  const price = data.servicePriceCents ? `$${(data.servicePriceCents / 100).toFixed(0)}` : '';

  return (
    <BaseLayout width={width} height={height} showWatermark={showWatermark}>
      {/* Background Pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 30%, #2a2a4e 0%, #1A1A2E 70%)',
        }}
      />

      {/* Gold accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: width * 0.008, backgroundColor: '#C9A96E' }} />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: `${width * 0.08}px`,
          textAlign: 'center',
        }}
      >
        {/* Barber name */}
        <div style={{ fontSize: width * 0.03, color: '#C9A96E', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: height * 0.03 }}>
          {data.barberName}
        </div>

        {/* Scissors divider */}
        <div style={{ fontSize: width * 0.05, marginBottom: height * 0.02 }}>✂️</div>

        {/* Service name */}
        <div style={{ fontSize: width * 0.07, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: height * 0.015 }}>
          {data.serviceName}
        </div>

        {/* Price */}
        {price && (
          <div style={{ fontSize: width * 0.12, fontWeight: 800, color: '#C9A96E', lineHeight: 1, marginBottom: height * 0.015 }}>
            {price}
          </div>
        )}

        {/* Duration */}
        {data.serviceDurationMinutes && (
          <div
            style={{
              display: 'inline-block',
              padding: `${height * 0.008}px ${width * 0.04}px`,
              border: '1px solid rgba(201, 169, 110, 0.5)',
              borderRadius: width * 0.005,
              fontSize: width * 0.025,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {data.serviceDurationMinutes} minutes
          </div>
        )}

        {/* Location */}
        <div style={{ fontSize: width * 0.022, color: 'rgba(255,255,255,0.5)', marginTop: height * 0.04 }}>
          📍 {data.city}, {data.state}
        </div>
      </div>
    </BaseLayout>
  );
}

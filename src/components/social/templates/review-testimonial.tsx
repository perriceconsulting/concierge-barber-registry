import React from 'react';
import type { SocialPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: SocialPostData;
  platform: PlatformConfig;
}

export function ReviewTestimonial({ data, platform }: Props) {
  const { width, height } = platform;
  const showWatermark = data.tier === 'starter';
  const stars = '★'.repeat(data.reviewRating || 5) + '☆'.repeat(5 - (data.reviewRating || 5));

  return (
    <BaseLayout width={width} height={height} showWatermark={showWatermark}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
        }}
      />

      {/* Gold accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: width * 0.008, backgroundColor: '#C9A96E' }} />

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
        {/* Large quote mark */}
        <div style={{ fontSize: width * 0.15, color: 'rgba(201, 169, 110, 0.3)', lineHeight: 0.8, marginBottom: height * 0.01 }}>
          &ldquo;
        </div>

        {/* Review text */}
        <div
          style={{
            fontSize: width * 0.035,
            color: '#FFFFFF',
            lineHeight: 1.5,
            maxWidth: '85%',
            fontStyle: 'italic',
          }}
        >
          {data.reviewComment || 'Amazing experience!'}
        </div>

        {/* Stars */}
        <div style={{ fontSize: width * 0.05, color: '#C9A96E', marginTop: height * 0.03, letterSpacing: '4px' }}>
          {stars}
        </div>

        {/* Reviewer */}
        <div style={{ fontSize: width * 0.025, color: 'rgba(255,255,255,0.6)', marginTop: height * 0.015 }}>
          — {data.reviewerName || 'Happy Client'}
        </div>

        {/* Divider */}
        <div style={{ width: width * 0.15, height: 1, backgroundColor: '#C9A96E', marginTop: height * 0.04, marginBottom: height * 0.02 }} />

        {/* Barber name */}
        <div style={{ fontSize: width * 0.04, fontWeight: 700, color: '#C9A96E' }}>
          {data.barberName}
        </div>
        <div style={{ fontSize: width * 0.02, color: 'rgba(255,255,255,0.5)', marginTop: height * 0.005 }}>
          📍 {data.city}, {data.state}
        </div>
      </div>
    </BaseLayout>
  );
}

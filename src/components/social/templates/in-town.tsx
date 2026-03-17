import React from 'react';
import type { SocialPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: SocialPostData;
  platform: PlatformConfig;
}

export function InTown({ data, platform }: Props) {
  const { width, height } = platform;
  const showWatermark = data.tier === 'starter';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const dateRange = data.travelStartDate && data.travelEndDate
    ? `${formatDate(data.travelStartDate)} - ${formatDate(data.travelEndDate)}`
    : '';

  return (
    <BaseLayout width={width} height={height} showWatermark={showWatermark}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(160deg, #C9A96E 0%, #8B6914 30%, #1A1A2E 60%)',
        }}
      />

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
        {/* Airplane icon */}
        <div style={{ fontSize: width * 0.08, marginBottom: height * 0.02 }}>✈️</div>

        {/* Header */}
        <div style={{ fontSize: width * 0.04, fontWeight: 700, color: '#FFFFFF', letterSpacing: '3px', textTransform: 'uppercase' }}>
          I&apos;M IN TOWN
        </div>

        {/* City */}
        <div style={{ fontSize: width * 0.09, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginTop: height * 0.02 }}>
          {data.travelCity || 'Your City'}
        </div>
        <div style={{ fontSize: width * 0.035, color: 'rgba(255,255,255,0.8)', marginTop: height * 0.005 }}>
          {data.travelState}
        </div>

        {/* Date range */}
        {dateRange && (
          <div
            style={{
              marginTop: height * 0.03,
              padding: `${height * 0.012}px ${width * 0.06}px`,
              border: '2px solid rgba(255,255,255,0.8)',
              borderRadius: width * 0.008,
              fontSize: width * 0.035,
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            {dateRange}
          </div>
        )}

        {/* Urgency */}
        <div style={{ fontSize: width * 0.025, color: '#C9A96E', marginTop: height * 0.025, fontWeight: 600 }}>
          LIMITED SPOTS AVAILABLE
        </div>

        {/* Divider */}
        <div style={{ width: width * 0.2, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: height * 0.03, marginBottom: height * 0.02 }} />

        {/* Barber branding */}
        <div style={{ fontSize: width * 0.04, fontWeight: 700, color: '#FFFFFF' }}>
          {data.barberName}
        </div>
        {data.instagramHandle && (
          <div style={{ fontSize: width * 0.022, color: 'rgba(255,255,255,0.7)', marginTop: height * 0.005 }}>
            @{data.instagramHandle.replace('@', '')}
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            marginTop: height * 0.03,
            padding: `${height * 0.012}px ${width * 0.06}px`,
            backgroundColor: '#FFFFFF',
            color: '#1A1A2E',
            fontWeight: 700,
            fontSize: width * 0.028,
            borderRadius: width * 0.008,
          }}
        >
          BOOK YOUR SPOT
        </div>
      </div>
    </BaseLayout>
  );
}

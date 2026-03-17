import React from 'react';
import type { SocialPostData, PlatformConfig } from '@/types/social';
import { BaseLayout } from './base-layout';

interface Props {
  data: SocialPostData;
  platform: PlatformConfig;
}

export function NewClientSpecial({ data, platform }: Props) {
  const { width, height } = platform;
  const showWatermark = data.tier === 'starter';

  return (
    <BaseLayout width={width} height={height} showWatermark={showWatermark}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #1A1A2E 0%, #0F3460 50%, #1A1A2E 100%)',
        }}
      />

      {/* Gold borders top and bottom */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: width * 0.012, backgroundColor: '#C9A96E' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: width * 0.012, backgroundColor: '#C9A96E' }} />

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
          padding: `${width * 0.1}px`,
          textAlign: 'center',
        }}
      >
        {/* Star burst */}
        <div style={{ fontSize: width * 0.06, marginBottom: height * 0.015 }}>🎉</div>

        {/* Header */}
        <div
          style={{
            fontSize: width * 0.035,
            fontWeight: 700,
            color: '#C9A96E',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            borderBottom: '2px solid rgba(201, 169, 110, 0.5)',
            paddingBottom: height * 0.012,
            marginBottom: height * 0.025,
          }}
        >
          NEW CLIENT SPECIAL
        </div>

        {/* Promo text */}
        <div style={{ fontSize: width * 0.055, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3, maxWidth: '90%' }}>
          {data.promoText || 'First visit discount!'}
        </div>

        {/* Divider */}
        <div style={{ width: width * 0.15, height: 2, backgroundColor: '#C9A96E', marginTop: height * 0.04, marginBottom: height * 0.03 }} />

        {/* Barber branding */}
        <div style={{ fontSize: width * 0.04, fontWeight: 700, color: '#C9A96E' }}>
          {data.barberName}
        </div>
        <div style={{ fontSize: width * 0.022, color: 'rgba(255,255,255,0.6)', marginTop: height * 0.005 }}>
          📍 {data.city}, {data.state}
        </div>

        {data.instagramHandle && (
          <div style={{ fontSize: width * 0.022, color: 'rgba(255,255,255,0.5)', marginTop: height * 0.008 }}>
            @{data.instagramHandle.replace('@', '')}
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            marginTop: height * 0.03,
            padding: `${height * 0.012}px ${width * 0.06}px`,
            backgroundColor: '#C9A96E',
            color: '#1A1A2E',
            fontWeight: 700,
            fontSize: width * 0.028,
            borderRadius: width * 0.008,
          }}
        >
          BOOK NOW
        </div>
      </div>
    </BaseLayout>
  );
}

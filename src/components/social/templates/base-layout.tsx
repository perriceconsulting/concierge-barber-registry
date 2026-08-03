import React from 'react';

interface BaseLayoutProps {
  width: number;
  height: number;
  backgroundImageUrl?: string;
  showWatermark: boolean;
  children: React.ReactNode;
}

export function BaseLayout({ width, height, backgroundImageUrl, showWatermark, children }: BaseLayoutProps) {
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#1A1A2E',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background image */}
      {backgroundImageUrl && (
        /* Rasterized by html-to-image, which needs a plain <img> with crossOrigin
           set to keep the canvas untainted. next/image's wrapper and srcset
           break the export. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundImageUrl}
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

      {/* Dark overlay for text readability */}
      {backgroundImageUrl && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(26,26,46,0.6) 0%, rgba(26,26,46,0.75) 40%, rgba(26,26,46,0.9) 100%)',
          }}
        />
      )}

      {children}

      {showWatermark && (
        <div
          style={{
            position: 'absolute',
            bottom: height * 0.015,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: width * 0.018,
            color: 'rgba(255, 255, 255, 0.5)',
            letterSpacing: '0.5px',
            zIndex: 10,
          }}
        >
          Made with Concierge Barber Registry
        </div>
      )}
    </div>
  );
}

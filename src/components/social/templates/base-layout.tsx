import React from 'react';

const SEO_KEYWORDS = [
  'FADE', 'LINEUP', 'TAPER', 'BEARD TRIM', 'HOT TOWEL SHAVE',
  'BARBER', 'GROOMING', 'FRESH CUT', 'CLEAN FADE', 'SKIN FADE',
  'SCISSOR CUT', 'HAIR DESIGN', 'BEARD SHAPE', 'EDGE UP', 'BLOWOUT',
  'FLAT TOP', 'MOHAWK', 'AFRO', 'BRAIDS', 'TEMPLE FADE',
  'MID FADE', 'HIGH FADE', 'LOW FADE', 'BALD FADE', 'RAZOR',
];

interface BaseLayoutProps {
  width: number;
  height: number;
  showWatermark: boolean;
  children: React.ReactNode;
}

export function BaseLayout({ width, height, showWatermark, children }: BaseLayoutProps) {
  const keywordFontSize = width * 0.018;
  const rows = Math.ceil(height / (keywordFontSize * 2.5));

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
      {/* SEO keyword texture background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          opacity: 0.04,
        }}
      >
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              whiteSpace: 'nowrap',
              fontSize: keywordFontSize,
              fontWeight: 700,
              color: '#C9A96E',
              letterSpacing: '4px',
              lineHeight: 2.5,
              transform: rowIndex % 2 === 0 ? 'translateX(-10%)' : 'translateX(-30%)',
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i}>
                {SEO_KEYWORDS.slice((rowIndex * 3 + i) % SEO_KEYWORDS.length).concat(
                  SEO_KEYWORDS.slice(0, (rowIndex * 3 + i) % SEO_KEYWORDS.length)
                ).join('  ·  ')}{' · '}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Barber pole stripe accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: width * 0.008,
          height: '100%',
          background: `repeating-linear-gradient(
            135deg,
            #C9A96E 0px,
            #C9A96E ${width * 0.015}px,
            #FFFFFF ${width * 0.015}px,
            #FFFFFF ${width * 0.03}px,
            #E94560 ${width * 0.03}px,
            #E94560 ${width * 0.045}px,
            #FFFFFF ${width * 0.045}px,
            #FFFFFF ${width * 0.06}px
          )`,
          opacity: 0.6,
        }}
      />

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
          }}
        >
          Made with Concierge Barber Registry
        </div>
      )}
    </div>
  );
}

import React from 'react';

interface BaseLayoutProps {
  width: number;
  height: number;
  showWatermark: boolean;
  children: React.ReactNode;
}

export function BaseLayout({ width, height, showWatermark, children }: BaseLayoutProps) {
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

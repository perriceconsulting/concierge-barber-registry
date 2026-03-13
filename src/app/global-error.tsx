'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '3.75rem',
              fontWeight: 'bold',
              color: '#ef4444',
              margin: '0 0 1rem 0'
            }}>
              Error
            </h1>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: '0 0 0.5rem 0'
            }}>
              Application Error
            </h2>
            <p style={{
              color: '#6b7280',
              margin: '0 0 1rem 0'
            }}>
              A critical error occurred. Please refresh the page or contact support.
            </p>
            {error.digest && (
              <p style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                margin: '0 0 1.5rem 0'
              }}>
                Error ID: <code style={{
                  backgroundColor: '#f3f4f6',
                  padding: '0.125rem 0.25rem',
                  borderRadius: '0.25rem'
                }}>{error.digest}</code>
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

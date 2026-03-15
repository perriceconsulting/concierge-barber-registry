'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createLogger } from '@/lib/logger';

const logger = createLogger('APP');

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-destructive">500</h1>
            <h2 className="text-2xl font-semibold">Something Went Wrong</h2>
            <p className="text-muted-foreground">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: <code className="bg-muted px-1 py-0.5 rounded">{error.digest}</code>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button onClick={() => reset()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

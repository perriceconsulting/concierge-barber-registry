'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AUTH');

function getRedirectPath(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin/barbers';
    case 'barber':
      return '/dashboard';
    default:
      return '/';
  }
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [message, setMessage] = useState('');
  const [redirectPath, setRedirectPath] = useState('/dashboard');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      return;
    }

    // Call verification endpoint
    fetch(`/api/auth/verify-email?token=${token}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const path = getRedirectPath(data.data.role);
          setRedirectPath(path);
          if (data.data.alreadyVerified) {
            setStatus('already-verified');
            setMessage(data.data.message);
          } else {
            setStatus('success');
            setMessage(data.data.message);
            // Redirect after 3 seconds
            setTimeout(() => {
              router.push(path);
            }, 3000);
          }
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to verify email');
        }
      })
      .catch((error) => {
        logger.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email');
      });
  }, [token, router]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verification Failed</CardTitle>
            <CardDescription>No verification token provided</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && '✓ Email Verified'}
            {status === 'already-verified' && '✓ Already Verified'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address'}
            {status === 'success' && 'Redirecting you to your dashboard...'}
            {status === 'already-verified' && 'Your email was already verified'}
            {status === 'error' && 'There was a problem verifying your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-6xl">✓</div>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">You&apos;ll be redirected to your dashboard in a few seconds...</p>
            </div>
          )}

          {status === 'already-verified' && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">{message}</p>
              <Button onClick={() => router.push(redirectPath)} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-destructive text-center">{message}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push('/login')} className="flex-1">
                  Go to Login
                </Button>
                <Button onClick={() => router.push('/dashboard/settings')} className="flex-1">
                  Resend Email
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

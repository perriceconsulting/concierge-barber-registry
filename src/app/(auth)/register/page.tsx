'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config';
import { secureFetch } from '@/lib/csrf-client';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'client' as 'client' | 'barber',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await secureFetch(ROUTES.API_AUTH_REGISTER, {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from Zod
        if (data.error?.details && Array.isArray(data.error.details)) {
          const errorMessages = data.error.details.map((detail: { message: string }) => detail.message).join('. ');
          throw new Error(errorMessages);
        }
        throw new Error(data.error?.message || data.message || 'Registration failed');
      }

      // Show verification modal instead of redirecting
      setShowVerifyModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerifyModal) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              We sent a verification link to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="font-medium text-lg">{formData.email}</p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Click the link in the email to verify your account and get started.</p>
              <p>The link will expire in 24 hours.</p>
            </div>
            <div className="pt-2 space-y-3">
              <Button
                className="w-full"
                onClick={() => router.push(ROUTES.LOGIN)}
              >
                Go to Sign In
              </Button>
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive the email? Check your spam folder or contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Join Concierge Barber Registry today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>I am a</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={formData.role === 'client' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setFormData({ ...formData, role: 'client' })}
                  disabled={isLoading}
                >
                  Client
                </Button>
                <Button
                  type="button"
                  variant={formData.role === 'barber' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setFormData({ ...formData, role: 'barber' })}
                  disabled={isLoading}
                >
                  Barber
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
          <div className="text-xs text-center text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link href={ROUTES.TERMS} className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href={ROUTES.PRIVACY} className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

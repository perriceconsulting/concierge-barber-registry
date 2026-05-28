'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config';
import { secureFetch } from '@/lib/csrf-client';

export default function LoginPage() {
  const [formData, setFormData] = useState(() => {
    // Restore remembered email from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rememberedEmail');
      if (saved) {
        return { email: saved, password: '', rememberMe: true };
      }
    }
    return { email: '', password: '', rememberMe: false };
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect already-authenticated users to their dashboard.
  // /api/auth/me returns 200 { user: null } for guests (so we don't pollute
  // the browser console with 401s), so we must check for a real user object,
  // not just a successful response — otherwise guests get bounced off /login.
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const user = data.data?.user;
        if (!user) return; // guest — stay on login
        const role = user.role;
        if (role === 'admin') {
          window.location.href = ROUTES.ADMIN;
        } else if (role === 'barber') {
          window.location.href = ROUTES.DASHBOARD;
        } else {
          window.location.href = ROUTES.HOME;
        }
      } catch {
        // Network failure — stay on login page
      }
    }
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await secureFetch(ROUTES.API_AUTH_LOGIN, {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // Save or clear remembered email
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Redirect based on user role with full page reload to update header
      const user = data.data?.user;
      if (user?.role === 'admin') {
        window.location.href = ROUTES.ADMIN;
      } else if (user?.role === 'barber') {
        window.location.href = ROUTES.DASHBOARD;
      } else {
        window.location.href = ROUTES.HOME;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href={ROUTES.FORGOT_PASSWORD}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="rounded border-input"
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="text-sm cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href={ROUTES.REGISTER} className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
          <div className="w-full border-t pt-4">
            <p className="text-xs font-medium text-center text-muted-foreground mb-2">Having trouble signing in?</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                <Link href={ROUTES.FORGOT_PASSWORD} className="text-primary hover:underline">
                  Reset your password
                </Link>
                {' '}if you&apos;ve forgotten it
              </li>
              <li>
                Check your email for a{' '}
                <Link href={ROUTES.REGISTER} className="text-primary hover:underline">
                  verification link
                </Link>
                {' '}if you just registered
              </li>
              <li>
                <Link href={ROUTES.FAQ} className="text-primary hover:underline">
                  Visit our FAQ
                </Link>
                {' '}for more help
              </li>
            </ul>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

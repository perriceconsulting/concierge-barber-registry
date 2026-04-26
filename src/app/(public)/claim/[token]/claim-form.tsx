'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';
import { ROUTES } from '@/config';

interface ClaimFormProps {
  token: string;
  defaultEmail: string;
  profileSlug: string;
}

export function ClaimForm({ token, defaultEmail }: ClaimFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const response = await secureFetch('/api/claim', {
        method: 'POST',
        body: JSON.stringify({
          token,
          email,
          password,
          agreedToTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const message =
          data.message ||
          data.error?.message ||
          (data.error === 'invalid_token'
            ? 'This claim link is no longer valid.'
            : data.error === 'already_claimed'
            ? 'This profile has already been claimed.'
            : data.error === 'email_in_use'
            ? data.message
            : 'Could not claim profile. Please try again.');
        setError(message);
        return;
      }

      showToast({ title: 'Profile claimed!', variant: 'success' });
      router.push(data.data?.redirectTo || ROUTES.DASHBOARD);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={submitting}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={submitting}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters with uppercase, lowercase, number, and special character.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={submitting}
          autoComplete="new-password"
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="agreedToTerms"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="rounded border-input mt-1"
          disabled={submitting}
          required
        />
        <Label
          htmlFor="agreedToTerms"
          className="text-xs text-muted-foreground font-normal leading-relaxed"
        >
          I agree to the{' '}
          <Link
            href={ROUTES.TERMS}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href={ROUTES.PRIVACY}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </Link>
        </Label>
      </div>

      <Button type="submit" disabled={submitting || !agreedToTerms} className="w-full">
        {submitting ? 'Claiming...' : 'Claim My Profile'}
      </Button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SETUP_FEE_CARD');

interface SetupFeeCardProps {
  setupFeePaidAt: string | null;
  setupFeeAmountCents: number | null;
  foundingMember: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended' | 'expired';
}

/**
 * CBR v2.0 — Verification Setup Fee gate (FEAT-001).
 *
 * Renders one of four states on the barber dashboard:
 *   - Founding Member  → green "exempt" message
 *   - Already paid     → "✓ Setup Fee Paid" with timestamp
 *   - Already verified → hidden (caller decides)
 *   - Unpaid           → "Pay Setup Fee" CTA that hits the checkout endpoint
 */
export function SetupFeeCard({
  setupFeePaidAt,
  setupFeeAmountCents,
  foundingMember,
  verificationStatus,
}: SetupFeeCardProps) {
  const { showToast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Already verified — no need to surface this card at all.
  if (verificationStatus === 'approved') return null;

  if (foundingMember) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-lg text-primary">
              Verification Setup Fee
            </CardTitle>
            <Badge className="badge-verified gold-shimmer">Founding Member</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            As a Founding Member, your setup fee is waived. Upload your license below and an admin will verify your application directly.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (setupFeePaidAt) {
    const formatted = new Date(setupFeePaidAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const amount = setupFeeAmountCents != null
      ? `$${(setupFeeAmountCents / 100).toFixed(2)}`
      : null;
    return (
      <Card className="premium-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-lg text-primary">
              Verification Setup Fee
            </CardTitle>
            <Badge variant="success">✓ Paid</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Setup fee paid on {formatted}{amount ? ` (${amount})` : ''}. You can now upload your license and submit for verification.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Unpaid — show CTA
  async function handlePay() {
    setIsCheckingOut(true);
    try {
      const res = await secureFetch('/api/barbers/verification-payment/checkout', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data?.data?.url) {
        const msg = data?.error?.message || 'Could not start checkout. Please try again.';
        throw new Error(msg);
      }
      // Redirect to Stripe Checkout
      window.location.href = data.data.url;
    } catch (err) {
      logger.error('Setup fee checkout failed', err);
      showToast({
        title: 'Checkout failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
      setIsCheckingOut(false);
    }
  }

  return (
    <Card className="premium-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-lg text-primary">
            Verification Setup Fee Required
          </CardTitle>
          <Badge variant="warning">Unpaid</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          A one-time application fee covers manual license verification, background check, and your digital credential. Your verified status is locked until this is paid.
        </p>
        <p className="text-xs text-muted-foreground mb-4 italic">
          Founding Member pricing automatically applies if seats are still available — confirmed at checkout.
        </p>
        <Button onClick={handlePay} disabled={isCheckingOut}>
          {isCheckingOut ? 'Redirecting to checkout…' : 'Pay Setup Fee'}
        </Button>
      </CardContent>
    </Card>
  );
}

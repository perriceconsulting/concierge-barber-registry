'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';
import { createLogger } from '@/lib/logger';
import {
  MEMBERSHIP_PRICING,
  ANNUAL_SAVING_PERCENT,
  PAYMENT_POLICY,
} from '@/lib/copy/v2';

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
  // Annual is the default. The API defaults to it too, so this stays correct
  // even if the request is made without a plan.
  const [plan, setPlan] = useState<'annual' | 'monthly'>('annual');

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
        body: JSON.stringify({ plan }),
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

        {/* Membership cadence is chosen here, before payment, so approval can
            provision the subscription without asking again. Annual is
            pre-selected — it is the headline offer, not just an option. */}
        <fieldset className="mb-4">
          <legend className="text-sm font-medium text-heading mb-2">
            Choose your membership, billed after your trial
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                {
                  value: 'annual' as const,
                  price: `$${MEMBERSHIP_PRICING.annual}`,
                  cadence: '/year',
                  note: `Best value — save ~${ANNUAL_SAVING_PERCENT}%`,
                },
                {
                  value: 'monthly' as const,
                  price: `$${MEMBERSHIP_PRICING.monthly}`,
                  cadence: '/month',
                  note: 'Billed monthly',
                },
              ]
            ).map((option) => {
              const isSelected = plan === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer flex-col rounded-lg border px-4 py-3 transition-colors ${
                    isSelected
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="membership-plan"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => setPlan(option.value)}
                      className="accent-primary"
                    />
                    <span className="font-semibold text-heading">
                      {option.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        {option.cadence}
                      </span>
                    </span>
                  </span>
                  <span className="mt-1 pl-6 text-xs text-muted-foreground">{option.note}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {PAYMENT_POLICY.prepaidNotAccepted} You can switch plans later from your
            billing portal.
          </p>
        </fieldset>

        <Button onClick={handlePay} disabled={isCheckingOut}>
          {isCheckingOut ? 'Redirecting to checkout…' : 'Pay Setup Fee'}
        </Button>
      </CardContent>
    </Card>
  );
}

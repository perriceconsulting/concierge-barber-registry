'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TIER_LIMITS, type TierName } from '@/lib/subscription';

interface SubscriptionData {
  tier: TierName;
  status: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    portfolioImages: { current: number; limit: number | null };
    services: { current: number; limit: number | null };
    contactRequests: { current: number; limit: number | null };
  };
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/barbers/subscription');
        if (response.ok && !cancelled) {
          const data = await response.json();
          setSubscription(data.data);
        }
      } catch {
        // Will show starter state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchSubscription();
    return () => { cancelled = true; };
  }, []);

  const handleCheckout = async (priceKey: 'professional' | 'elite', interval: 'monthly' | 'annual') => {
    setIsCheckoutLoading(`${priceKey}-${interval}`);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey, interval }),
      });
      const data = await response.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch {
      // Error handling
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await response.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch {
      // Error handling
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Subscription</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  const currentTier: TierName = subscription?.tier || 'starter';
  const tierConfig = TIER_LIMITS[currentTier];
  const isTrialing = subscription?.status === 'trialing';
  const isPastDue = subscription?.status === 'past_due';
  const isCanceling = subscription?.cancelAtPeriodEnd;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your plan and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan: {tierConfig.displayName}</CardTitle>
              <CardDescription>
                {isTrialing && subscription?.trialEndsAt && (
                  <>Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}</>
                )}
                {isPastDue && (
                  <span className="text-destructive font-medium">Payment past due — please update your billing info</span>
                )}
                {isCanceling && subscription?.currentPeriodEnd && (
                  <>Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                )}
                {!isTrialing && !isPastDue && !isCanceling && currentTier === 'starter' && (
                  <>Free forever — upgrade to unlock more features</>
                )}
                {!isTrialing && !isPastDue && !isCanceling && currentTier !== 'starter' && subscription?.currentPeriodEnd && (
                  <>Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                )}
              </CardDescription>
            </div>
            <Badge variant={currentTier === 'starter' ? 'secondary' : 'default'}>
              {tierConfig.displayName}
            </Badge>
          </div>
        </CardHeader>
        {currentTier !== 'starter' && (
          <CardContent>
            <Button variant="outline" onClick={handleManageBilling}>
              Manage Billing
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Usage */}
      {subscription?.usage && (
        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>Your current usage against plan limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <UsageRow
                label="Portfolio Images"
                current={subscription.usage.portfolioImages.current}
                limit={subscription.usage.portfolioImages.limit}
              />
              <UsageRow
                label="Active Services"
                current={subscription.usage.services.current}
                limit={subscription.usage.services.limit}
              />
              <UsageRow
                label="Contact Requests (30 days)"
                current={subscription.usage.contactRequests.current}
                limit={subscription.usage.contactRequests.limit}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {currentTier === 'starter' ? 'Upgrade Your Plan' : 'Available Plans'}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Starter */}
          <PlanCard
            name="Starter"
            price="Free"
            description="Get started with the basics"
            features={[
              '5 portfolio images',
              '3 services listed',
              '10 contact requests/month',
            ]}
            isCurrent={currentTier === 'starter'}
          />

          {/* Professional */}
          <PlanCard
            name="Professional"
            price="$29/mo"
            annualPrice="$290/yr"
            description="Everything you need to grow"
            features={[
              '20 portfolio images',
              '10 services listed',
              'Unlimited contact requests',
              'Review responses',
              'SEO structured data',
              '"Pro" profile badge',
            ]}
            isCurrent={currentTier === 'professional'}
            highlighted
            onSelectMonthly={() => handleCheckout('professional', 'monthly')}
            onSelectAnnual={() => handleCheckout('professional', 'annual')}
            isLoading={isCheckoutLoading?.startsWith('professional') || false}
            canUpgrade={currentTier === 'starter'}
          />

          {/* Elite */}
          <PlanCard
            name="Elite"
            price="$59/mo"
            annualPrice="$590/yr"
            description="Maximum visibility and features"
            features={[
              '100 portfolio images',
              '50 services listed',
              'Unlimited contact requests',
              'Review responses',
              'SEO structured data',
              'Featured in search results',
              '"Elite" profile badge',
            ]}
            isCurrent={currentTier === 'elite'}
            onSelectMonthly={() => handleCheckout('elite', 'monthly')}
            onSelectAnnual={() => handleCheckout('elite', 'annual')}
            isLoading={isCheckoutLoading?.startsWith('elite') || false}
            canUpgrade={currentTier !== 'elite'}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          All paid plans include a {14}-day free trial. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

function UsageRow({ label, current, limit }: { label: string; current: number; limit: number | null }) {
  const percentage = limit ? Math.min((current / limit) * 100, 100) : 0;
  const isNearLimit = limit ? current >= limit * 0.8 : false;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className={isNearLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}>
          {current} / {limit ?? 'Unlimited'}
        </span>
      </div>
      {limit && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? 'bg-destructive' : 'bg-primary'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function PlanCard({
  name,
  price,
  annualPrice,
  description,
  features,
  isCurrent,
  highlighted,
  onSelectMonthly,
  onSelectAnnual,
  isLoading,
  canUpgrade,
}: {
  name: string;
  price: string;
  annualPrice?: string;
  description: string;
  features: string[];
  isCurrent: boolean;
  highlighted?: boolean;
  onSelectMonthly?: () => void;
  onSelectAnnual?: () => void;
  isLoading?: boolean;
  canUpgrade?: boolean;
}) {
  return (
    <Card className={highlighted ? 'border-primary shadow-md' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {name}
          {isCurrent && <Badge>Current</Badge>}
        </CardTitle>
        <div>
          <span className="text-2xl font-bold">{price}</span>
          {annualPrice && (
            <span className="text-sm text-muted-foreground ml-2">or {annualPrice}</span>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {features.map((feature) => (
            <li key={feature} className="text-sm flex items-start gap-2">
              <span className="text-primary mt-0.5">&#10003;</span>
              {feature}
            </li>
          ))}
        </ul>
        {!isCurrent && canUpgrade && onSelectMonthly && (
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={onSelectMonthly}
              disabled={isLoading}
            >
              {isLoading ? 'Redirecting...' : `Start Free Trial — ${price}`}
            </Button>
            {onSelectAnnual && annualPrice && (
              <Button
                variant="outline"
                className="w-full"
                onClick={onSelectAnnual}
                disabled={isLoading}
              >
                Annual — {annualPrice} (save ~17%)
              </Button>
            )}
          </div>
        )}
        {isCurrent && name !== 'Starter' && (
          <p className="text-sm text-muted-foreground text-center">Your current plan</p>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TIER_LIMITS, type TierName } from '@/lib/subscription';
import { MEMBERSHIP_PRICING, ANNUAL_SAVING_PERCENT } from '@/lib/copy/v2';
import { secureFetch } from '@/lib/csrf-client';

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
  const [hasProfile, setHasProfile] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [subRes, profileRes] = await Promise.all([
          fetch('/api/barbers/subscription'),
          fetch('/api/barbers/profile', { credentials: 'include' }),
        ]);
        if (cancelled) return;

        if (subRes.ok) {
          const data = await subRes.json();
          setSubscription(data.data);
        } else if (subRes.status === 404) {
          setHasProfile(false);
        }

        if (profileRes.ok) {
          const profData = await profileRes.json();
          const profile = profData.data?.barberProfile || profData.barberProfile;
          setVerificationStatus(profile?.verificationStatus || null);
        }
      } catch {
        // Will show starter state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);


  const handleManageBilling = async () => {
    try {
      const response = await secureFetch('/api/stripe/portal', { method: 'POST' });
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
          <h1 className="text-3xl font-bold text-heading">Subscription</h1>
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
        <h1 className="text-3xl font-bold text-heading">Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your plan and billing
        </p>
      </div>

      {/* Verification Required Banner */}
      {hasProfile && verificationStatus && verificationStatus !== 'approved' && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">License verification required</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Your profile must be verified before you can upgrade your plan. Complete your license verification to unlock paid plans.
                </p>
              </div>
              <Link href="/dashboard/profile">
                <Button>Complete Verification</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Required Banner */}
      {!hasProfile && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">Complete your profile first</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  You need to set up your barber profile before you can subscribe to a plan. Add your name, bio, and location to get started.
                </p>
              </div>
              <Link href="/dashboard/profile">
                <Button>Set Up Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Membership. There is one plan — Verified Member — provisioned at
          approval on the cadence chosen during application. Barbers do not pick
          a tier here any more; cadence changes go through the Stripe billing
          portal above. */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Membership</h2>
        <Card>
          <CardContent className="py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Annual</p>
                <p className="mt-1 text-2xl font-bold text-heading">
                  ${MEMBERSHIP_PRICING.annual}
                  <span className="text-sm font-normal text-muted-foreground">/year</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Save ~{ANNUAL_SAVING_PERCENT}% against monthly
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Monthly</p>
                <p className="mt-1 text-2xl font-bold text-heading">
                  ${MEMBERSHIP_PRICING.monthly}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Billed every month</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Your membership starts automatically when your trial ends — no action needed.
              Use <strong className="text-foreground">Manage Billing</strong> above to switch
              cadence, update your card, or cancel.
            </p>
          </CardContent>
        </Card>
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


import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config';

interface UpgradeBannerProps {
  feature: string;
  currentUsage?: number;
  limit?: number;
  requiredTier?: 'professional' | 'elite';
}

export function UpgradeBanner({ feature, currentUsage, limit, requiredTier = 'professional' }: UpgradeBannerProps) {
  const tierName = requiredTier === 'elite' ? 'Elite' : 'Pro';

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="font-medium text-sm">
            {limit !== undefined && currentUsage !== undefined
              ? `You've used ${currentUsage} of ${limit} ${feature}`
              : `Upgrade to ${tierName} to unlock ${feature}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {limit !== undefined
              ? `Upgrade to ${tierName} for higher limits`
              : `This feature is available on the ${tierName} plan and above`}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={ROUTES.DASHBOARD_SUBSCRIPTION}>Upgrade</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

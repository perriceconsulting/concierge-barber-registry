import { Badge } from '@/components/ui/badge';
import type { TierName } from '@/lib/subscription';

interface TierBadgeProps {
  tier: TierName;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  if (tier === 'starter') return null;

  if (tier === 'professional') {
    return (
      <Badge variant="secondary" className={className}>
        Pro
      </Badge>
    );
  }

  return (
    <Badge variant="default" className={className}>
      Elite
    </Badge>
  );
}

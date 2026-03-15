'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TIERS = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Get listed and start building your online presence',
    features: {
      'Portfolio images': '5',
      'Services listed': '3',
      'Contact requests/month': '10',
      'Review responses': false,
      'SEO structured data': false,
      'Featured in search': false,
      'Profile badge': false,
    },
  },
  {
    name: 'Professional',
    price: '$29/mo',
    annualPrice: '$290/yr',
    description: 'Everything you need to grow your client base',
    highlighted: true,
    features: {
      'Portfolio images': '20',
      'Services listed': '10',
      'Contact requests/month': 'Unlimited',
      'Review responses': true,
      'SEO structured data': true,
      'Featured in search': false,
      'Profile badge': 'Pro',
    },
  },
  {
    name: 'Elite',
    price: '$59/mo',
    annualPrice: '$590/yr',
    description: 'Maximum visibility and all premium features',
    features: {
      'Portfolio images': '100',
      'Services listed': '50',
      'Contact requests/month': 'Unlimited',
      'Review responses': true,
      'SEO structured data': true,
      'Featured in search': true,
      'Profile badge': 'Elite',
    },
  },
];

export function PricingTable() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {TIERS.map((tier) => (
        <Card key={tier.name} className={tier.highlighted ? 'border-primary shadow-md' : ''}>
          <CardHeader>
            <CardTitle>{tier.name}</CardTitle>
            <div>
              <span className="text-2xl font-bold">{tier.price}</span>
              {tier.annualPrice && (
                <span className="text-sm text-muted-foreground ml-2">or {tier.annualPrice}</span>
              )}
            </div>
            <CardDescription>{tier.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(tier.features).map(([feature, value]) => (
                <li key={feature} className="text-sm flex items-center justify-between">
                  <span>{feature}</span>
                  {typeof value === 'boolean' ? (
                    <span className={value ? 'text-primary' : 'text-muted-foreground'}>
                      {value ? '&#10003;' : '—'}
                    </span>
                  ) : (
                    <Badge variant="secondary">{value}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

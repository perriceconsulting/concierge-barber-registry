import { APP_CONFIG } from '@/config';
import { JsonLd } from './json-ld';

interface BarberStructuredDataProps {
  barber: {
    id: string;
    displayName: string;
    slug: string;
    bio: string | null;
    address: string | null;
    city: string;
    state: string;
    zipCode: string;
    phone: string | null;
    website: string | null;
    averageRating: number;
    totalReviews: number;
    portfolioImages: Array<{ imageUrl: string }>;
    reviews: Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string | Date;
      client: {
        firstName: string;
        lastName: string;
      };
    }>;
  };
}

export function BarberStructuredData({ barber }: BarberStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${APP_CONFIG.url}/barbers/${barber.slug}`,
    name: barber.displayName,
    description:
      barber.bio || `Professional barber services in ${barber.city}, ${barber.state}`,
    image: barber.portfolioImages.map((img) => img.imageUrl),
    address: {
      '@type': 'PostalAddress',
      streetAddress: barber.address,
      addressLocality: barber.city,
      addressRegion: barber.state,
      postalCode: barber.zipCode,
      addressCountry: 'US',
    },
    telephone: barber.phone || undefined,
    url: barber.website || undefined,
    priceRange: '$$',
    ...(barber.averageRating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: barber.averageRating,
        reviewCount: barber.totalReviews,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(barber.reviews.length > 0 && {
      review: barber.reviews.map((review) => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: `${review.client.firstName} ${review.client.lastName}`,
        },
        datePublished: new Date(review.createdAt).toISOString(),
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: review.comment,
      })),
    }),
  };

  return <JsonLd data={structuredData} />;
}

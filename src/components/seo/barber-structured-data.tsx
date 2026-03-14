'use client';

interface BarberStructuredDataProps {
  barber: {
    id: string;
    displayName: string;
    slug: string;
    bio: string | null;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string | null;
    website: string | null;
    averageRating: number;
    totalReviews: number;
    portfolioImages: Array<{ imageUrl: string }>;
    operatingHours: Array<{
      dayOfWeek: number;
      openTime: string | null;
      closeTime: string | null;
      isClosed: boolean;
    }>;
    reviews: Array<{
      id: string;
      rating: number;
      comment: string;
      createdAt: Date;
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
    '@id': `${process.env.NEXT_PUBLIC_APP_URL || 'https://concierge-barber-registry.vercel.app'}/barbers/${barber.slug}`,
    name: barber.displayName,
    description: barber.bio || `Professional barber services in ${barber.city}, ${barber.state}`,
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
    ...(barber.operatingHours.length > 0 && {
      openingHoursSpecification: barber.operatingHours
        .filter((hours) => !hours.isClosed)
        .map((hours) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][hours.dayOfWeek],
          opens: hours.openTime,
          closes: hours.closeTime,
        })),
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

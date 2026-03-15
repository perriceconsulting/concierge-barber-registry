export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Concierge Barber Registry',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://conciergebarberregistry.com',
    description: 'Discover and connect with verified, top-rated barbers in your area. Browse portfolios, read reviews, and find your perfect cut.',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://conciergebarberregistry.com'}/contact`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

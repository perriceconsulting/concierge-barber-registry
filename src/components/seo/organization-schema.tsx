import { APP_CONFIG, SOCIAL_LINKS } from '@/config';
import { JsonLd } from './json-ld';

export function OrganizationSchema() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_CONFIG.name,
    url: APP_CONFIG.url,
    // icon-512.png, not favicon.svg — that file does not exist and this field
    // was advertising a 404 to every crawler that read it.
    logo: `${APP_CONFIG.url}/icon-512.png`,
    description: APP_CONFIG.description,
    sameAs: SOCIAL_LINKS.map((profile) => profile.url),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${APP_CONFIG.url}/contact`,
    },
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_CONFIG.name,
    url: APP_CONFIG.url,
    description: APP_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${APP_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <JsonLd data={organization} />
      <JsonLd data={website} />
    </>
  );
}

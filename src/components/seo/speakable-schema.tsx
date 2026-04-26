import { JsonLd } from './json-ld';

interface SpeakableSchemaProps {
  cssSelectors: string[];
}

export function SpeakableSchema({ cssSelectors }: SpeakableSchemaProps) {
  if (cssSelectors.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors,
    },
  };

  return <JsonLd data={jsonLd} />;
}

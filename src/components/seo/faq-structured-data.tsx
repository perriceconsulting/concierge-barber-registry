import { JsonLd } from './json-ld';

export interface FAQSchemaItem {
  question: string;
  answer: string;
}

interface FAQStructuredDataProps {
  items: FAQSchemaItem[];
}

export function FAQStructuredData({ items }: FAQStructuredDataProps) {
  if (items.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={jsonLd} />;
}

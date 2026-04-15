import { JsonLd } from './json-ld';

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
  image?: string;
}

interface HowToStructuredDataProps {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTimeIso8601?: string;
  image?: string;
}

export function HowToStructuredData({
  name,
  description,
  steps,
  totalTimeIso8601,
  image,
}: HowToStructuredDataProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(totalTimeIso8601 ? { totalTime: totalTimeIso8601 } : {}),
    ...(image ? { image } : {}),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url } : {}),
      ...(step.image ? { image: step.image } : {}),
    })),
  };

  return <JsonLd data={jsonLd} />;
}

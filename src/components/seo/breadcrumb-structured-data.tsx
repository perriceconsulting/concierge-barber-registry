import { APP_CONFIG } from '@/config';
import { JsonLd } from './json-ld';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${APP_CONFIG.url}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  };

  return <JsonLd data={jsonLd} />;
}

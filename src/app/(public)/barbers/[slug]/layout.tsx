import { Metadata } from 'next';
import { generateBarberMetadata } from './metadata';
import { RelatedArticlesForBarber } from '@/components/blog/related-articles-for-barber';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return generateBarberMetadata(slug);
}

export default async function BarberProfileLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;
  return (
    <>
      {children}
      <RelatedArticlesForBarber barberSlug={slug} />
    </>
  );
}

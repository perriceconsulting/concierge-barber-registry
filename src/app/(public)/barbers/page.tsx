import { Container } from '@/components/layout/container';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BarbersPage() {
  return (
    <div className="min-h-[calc(100vh-16rem)] py-12">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl mb-6">
            Browse Barbers
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Discover verified, top-rated barbers in your area
          </p>

          <div className="rounded-lg border bg-card p-12">
            <p className="text-muted-foreground mb-6">
              The barber directory is under development. Use the search page to find barbers.
            </p>
            <Link href="/search">
              <Button size="lg">Go to Search</Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

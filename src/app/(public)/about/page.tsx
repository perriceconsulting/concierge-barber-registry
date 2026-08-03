import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { SOCIAL_LINKS } from '@/config';

export const metadata: Metadata = buildPageMetadata({
  title: 'About Us',
  description:
    'Learn about Concierge Barber Registry — the platform connecting clients with verified, top-rated barbers. Our mission, story, and commitment to quality grooming.',
  path: '/about',
  keywords: ['about concierge barber registry', 'barber platform', 'find barbers', 'verified barbers'],
});

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-16rem)] py-16">
      <Container>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-heading mb-6">About Us</h1>

          <div className="prose prose-lg max-w-none space-y-6">
            <p className="text-lg text-muted-foreground">
              Welcome to Concierge Barber Registry, the premier platform connecting clients
              with verified, top-rated barbers across the country.
            </p>

            <h2 className="text-2xl font-bold text-heading mt-8 mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              We believe everyone deserves access to quality grooming services. Our mission
              is to make it easy for clients to discover talented barbers while providing
              barbers with a platform to showcase their skills and grow their business.
            </p>

            <h2 className="text-2xl font-bold text-heading mt-8 mb-4">What We Offer</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Verified professional barber profiles</li>
              <li>Authentic client reviews and ratings</li>
              <li>Portfolio galleries showcasing barber work</li>
              <li>Location-based search and filtering</li>
              <li>Direct contact with barbers</li>
              <li>Specialty-based discovery</li>
            </ul>

            <h2 className="text-2xl font-bold text-heading mt-8 mb-4">For Barbers</h2>
            <p className="text-muted-foreground">
              Join our community of professional barbers and expand your reach. Create a
              free profile, showcase your work, and connect with clients actively looking
              for your services.
            </p>

            <h2 className="text-2xl font-bold text-heading mt-8 mb-4">For Clients</h2>
            <p className="text-muted-foreground">
              Find your perfect barber by browsing portfolios, reading authentic reviews,
              and searching by location and specialty. Your next great haircut is just a
              search away.
            </p>

            <h2 className="text-2xl font-bold text-heading mt-8 mb-4">Follow Us</h2>
            <p className="text-muted-foreground">
              Cuts, barber spotlights and platform news — find us wherever you already are.
            </p>
            <ul className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 list-none pl-0">
              {SOCIAL_LINKS.map((profile) => (
                <li key={profile.name}>
                  {/* rel="me" is the other half of sameAs — it lets a profile
                      claim this site back, which is what verifies the link. */}
                  <a
                    href={profile.url}
                    target="_blank"
                    rel="me noopener noreferrer"
                    className="flex items-baseline gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/50"
                  >
                    <span className="font-medium text-heading">{profile.name}</span>
                    <span className="text-sm text-muted-foreground truncate">
                      {profile.handle}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </div>
  );
}

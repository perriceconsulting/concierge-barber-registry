import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { SocialLinks } from '@/components/layout/social-links';

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

          {/* prose-headings:text-heading — without it Typography's own heading
              colour beats the text-heading utility on the h2s below, so they
              rendered white while identical headings outside prose rendered
              gold. Same fix as the blog article page. */}
          <div className="prose prose-lg max-w-none space-y-6 prose-headings:text-heading">
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

          </div>

          {/* Deliberately outside the prose wrapper above — Typography styles
              bare a/li elements and turns these cards into an underlined
              bulleted list. */}
          <div className="mt-12 border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-heading mb-2">Follow Us</h2>
            <p className="text-muted-foreground mb-5">
              Cuts, barber spotlights and platform news — find us wherever you already are.
            </p>
            <SocialLinks />
          </div>
        </div>
      </Container>
    </div>
  );
}

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { Container } from '@/components/layout/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClaimForm } from './claim-form';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Claim Your Profile',
  description: 'Claim your Concierge Barber Registry profile and start managing your listing.',
  path: '/claim',
  noindex: true,
});

interface PageProps {
  params: Promise<{ token: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ClaimPage({ params }: PageProps) {
  const { token } = await params;

  if (!UUID_REGEX.test(token)) {
    notFound();
  }

  const profile = await prisma.barberProfile.findUnique({
    where: { claimToken: token },
    select: {
      id: true,
      displayName: true,
      slug: true,
      city: true,
      state: true,
      shopName: true,
      claimStatus: true,
      outreachEmail: true,
    },
  });

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-16rem)] py-16">
        <Container>
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>Link Not Valid</CardTitle>
                <CardDescription>
                  This claim link is no longer valid. The profile may have already been
                  claimed, or the link may have expired.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  If you believe this is your profile, please{' '}
                  <a href="/contact" className="text-primary underline">
                    contact support
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  if (profile.claimStatus === 'claimed') {
    return (
      <div className="min-h-[calc(100vh-16rem)] py-16">
        <Container>
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>Already Claimed</CardTitle>
                <CardDescription>
                  This profile has already been claimed. If it&apos;s yours, please log
                  in.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="/login"
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
                >
                  Sign In
                </a>
              </CardContent>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-16rem)] py-16">
      <Container>
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Claim Your Profile</CardTitle>
              <CardDescription>
                We created a profile for{' '}
                <span className="font-semibold text-primary">
                  {profile.displayName}
                </span>{' '}
                in {profile.city}, {profile.state}
                {profile.shopName ? ` (${profile.shopName})` : ''}. Set up your account
                to take ownership.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClaimForm
                token={token}
                defaultEmail={profile.outreachEmail || ''}
                profileSlug={profile.slug}
              />
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Not you?{' '}
            <a href={`/barbers/${profile.slug}`} className="underline">
              View the profile
            </a>{' '}
            or{' '}
            <a href="/contact" className="underline">
              request removal
            </a>
            .
          </p>
        </div>
      </Container>
    </div>
  );
}

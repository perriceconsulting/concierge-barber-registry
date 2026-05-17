'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DASHBOARD_CREDENTIALS');

interface ProfileSummary {
  verificationStatus: string;
  foundingMember: boolean;
  displayName: string;
  slug: string;
  city: string;
  state: string;
  shopName: string | null;
  verifiedAt: string | null;
}

export default function CredentialsPage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      try {
        const res = await fetch('/api/barbers/profile', { credentials: 'include' });
        const data = await res.json();
        if (!cancelled && data.success) {
          // The endpoint returns the full barber profile with various nesting.
          // Pull only what we need for this page.
          const b = data.data?.barberProfile ?? data.data;
          setProfile({
            verificationStatus: b.verificationStatus,
            foundingMember: b.foundingMember,
            displayName: b.displayName,
            slug: b.slug,
            city: b.city,
            state: b.state,
            shopName: b.shopName,
            verifiedAt: b.verifiedAt,
          });
        }
      } catch (err) {
        logger.error('Failed to load profile', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  function downloadFile(path: string, friendlyName: string) {
    // Trigger browser download by hitting the route. The endpoint sets
    // Content-Disposition: attachment, so the browser saves rather than navigates.
    window.location.href = path;
    showToast({
      title: `Generating ${friendlyName}`,
      description: 'Your download will start in a moment.',
      variant: 'success',
    });
  }

  async function tryWalletPass() {
    try {
      const res = await fetch('/api/barbers/credentials/wallet.pkpass', {
        credentials: 'include',
      });
      if (res.status === 503 || res.status === 501) {
        const data = await res.json();
        showToast({
          title: 'Apple Wallet not yet enabled',
          description: data?.error?.message || 'Use the printable PDF in the meantime.',
          variant: 'warning',
        });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast({
          title: 'Wallet pass failed',
          description: data?.error?.message || 'Try again later.',
          variant: 'error',
        });
        return;
      }
      // When Apple wallet is wired, the response will be a .pkpass file.
      window.location.href = '/api/barbers/credentials/wallet.pkpass';
    } catch (err) {
      logger.error('Wallet pass fetch failed', err);
    }
  }

  const isApproved = profile?.verificationStatus === 'approved';
  const tier = profile?.foundingMember ? 'Founding Member' : 'Verified Professional';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Credentials</h1>
        <p className="text-muted-foreground mt-1">
          Your professional Wallet pass, printable card, certificate, and the Concierge Privacy
          Agreement template.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !isApproved ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-muted-foreground">
              Credentials unlock once your license is verified by our team.
            </p>
            <p className="text-sm text-muted-foreground">
              Current status:{' '}
              <Badge variant="default">{profile?.verificationStatus ?? 'unknown'}</Badge>
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tier banner */}
          <Card
            className={
              profile?.foundingMember
                ? 'border-secondary/50 spotlight-soft'
                : 'border-secondary/30'
            }
          >
            <CardContent className="py-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Your tier</p>
                <p className="font-serif text-2xl text-primary mt-1">{tier}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Verified{' '}
                  {profile?.verifiedAt
                    ? new Date(profile.verifiedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
              <Badge variant="success" className="text-xs">
                ✓ Verified
              </Badge>
            </CardContent>
          </Card>

          {/* Apple Wallet */}
          <Card>
            <CardHeader>
              <CardTitle>Apple Wallet Pass</CardTitle>
              <CardDescription>
                Add your Verified Member pass directly to Apple Wallet for one-tap access at
                events and check-ins.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button onClick={tryWalletPass} variant="outline">
                Add to Apple Wallet
              </Button>
              <p className="text-xs text-muted-foreground">
                Apple Wallet rollout coming soon — use the printable PDF below in the meantime.
              </p>
            </CardContent>
          </Card>

          {/* Printable card PDF */}
          <Card>
            <CardHeader>
              <CardTitle>Printable Credential Card</CardTitle>
              <CardDescription>
                Business-card-sized PDF with your name, shop, and a QR linking to your public
                profile. Print at any third-party card vendor.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() =>
                  downloadFile('/api/barbers/credentials/print.pdf', 'credential card PDF')
                }
              >
                Download Card PDF
              </Button>
              <span className="text-xs text-muted-foreground">
                3.5″ × 2″ at 300 DPI · front + back
              </span>
            </CardContent>
          </Card>

          {/* Certificate PDF */}
          <Card>
            <CardHeader>
              <CardTitle>Certificate of Selection</CardTitle>
              <CardDescription>
                Frameable letter-size certificate confirming your{' '}
                {profile?.foundingMember ? 'Founding Member' : 'Verified Professional'} status.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() =>
                  downloadFile('/api/barbers/credentials/certificate.pdf', 'certificate')
                }
              >
                Download Certificate
              </Button>
              <span className="text-xs text-muted-foreground">
                Letter, landscape, dark luxury frame
              </span>
            </CardContent>
          </Card>

          {/* NDA template */}
          <Card>
            <CardHeader>
              <CardTitle>Concierge Privacy Agreement</CardTitle>
              <CardDescription>
                A 5-section privacy agreement template you can bring to discerning clients on
                first appointment. Pre-filled with your professional name; sign on paper.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  downloadFile('/api/barbers/legal/nda-template.pdf', 'privacy agreement')
                }
              >
                Download NDA Template
              </Button>
              <span className="text-xs text-muted-foreground">
                Not legal advice · review with your own counsel before relying
              </span>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

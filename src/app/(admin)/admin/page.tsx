'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/config';
import { secureFetch } from '@/lib/csrf-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ADMIN_DASHBOARD');

interface DashboardStats {
  totalBarbers: number;
  claimedBarbers: number;
  unclaimedBarbers: number;
  pendingVerifications: number;
  totalClients: number;
  totalReviews: number;
}

interface PendingBarber {
  id: string;
  displayName: string;
  city: string;
  submittedForVerificationAt: string | null;
  user: { email: string };
}

interface RecentSignup {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

interface RecentImport {
  id: string;
  displayName: string;
  shopName: string | null;
  city: string;
  state: string;
  dataSource: 'manual_admin' | 'google_places' | 'state_license';
  claimStatus: 'unclaimed' | 'claim_sent';
  createdAt: string;
}

const SOURCE_LABEL: Record<RecentImport['dataSource'], string> = {
  manual_admin: 'Manual',
  google_places: 'Google Places',
  state_license: 'License board',
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBarbers: 0,
    claimedBarbers: 0,
    unclaimedBarbers: 0,
    pendingVerifications: 0,
    totalClients: 0,
    totalReviews: 0,
  });
  const [pendingBarbers, setPendingBarbers] = useState<PendingBarber[]>([]);
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
  const [recentImports, setRecentImports] = useState<RecentImport[]>([]);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await secureFetch('/api/admin/dashboard');
        const json = await res.json();
        if (json.success) {
          setStats(json.data.stats);
          setPendingBarbers(json.data.pendingBarbers);
          setRecentSignups(json.data.recentSignups);
          setRecentImports(json.data.recentImports || []);
        }
      } catch (error) {
        logger.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-destructive">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Platform overview and management
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-destructive">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Platform overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Barbers</CardDescription>
            <CardTitle className="text-3xl">{stats.totalBarbers}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.ADMIN_BARBERS}>
              <Button variant="link" className="p-0 h-auto">View all</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardDescription>Pending Verifications</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pendingVerifications}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.ADMIN_BARBERS}>
              <Button variant="link" className="p-0 h-auto text-yellow-600">Review now</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Clients</CardDescription>
            <CardTitle className="text-3xl">{stats.totalClients}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.ADMIN_USERS}>
              <Button variant="link" className="p-0 h-auto">View all</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reviews</CardDescription>
            <CardTitle className="text-3xl">{stats.totalReviews}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.ADMIN_REVIEWS}>
              <Button variant="link" className="p-0 h-auto">Manage reviews</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Activity Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Verifications */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Barber Verifications</CardTitle>
            <CardDescription>Profiles awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingBarbers.map((barber) => (
                <div key={barber.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{barber.displayName}</p>
                    <p className="text-sm text-muted-foreground">{barber.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {barber.city}
                      {barber.submittedForVerificationAt && (
                        <> &bull; {new Date(barber.submittedForVerificationAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Review</Button>
                  </div>
                </div>
              ))}
              {pendingBarbers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending verifications
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>Real users who registered themselves (excludes admin imports)</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSignups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No real signups yet. Admin-imported profiles appear in &ldquo;Recent Imports&rdquo; below.
              </p>
            ) : (
              <div className="space-y-4">
                {recentSignups.map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={user.role === 'barber' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Imports — admin-created unclaimed profiles, separate from organic signups */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Imports</CardTitle>
                <CardDescription>
                  Unclaimed profiles you&apos;ve created (manual or Google Places). Send claim invitations from{' '}
                  <Link href={ROUTES.ADMIN_OUTREACH} className="text-primary underline">
                    Outreach
                  </Link>
                  .
                </CardDescription>
              </div>
              <Link href={ROUTES.ADMIN_IMPORT}>
                <Button variant="outline" size="sm">
                  + Import more
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentImports.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No imports yet.{' '}
                <Link href={ROUTES.ADMIN_IMPORT} className="text-primary underline">
                  Start with /admin/import
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-4">
                {recentImports.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{p.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.shopName ? `${p.shopName} · ` : ''}
                        {p.city}, {p.state}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()} · {SOURCE_LABEL[p.dataSource]}
                      </p>
                    </div>
                    <Badge variant={p.claimStatus === 'claim_sent' ? 'default' : 'secondary'}>
                      {p.claimStatus === 'claim_sent' ? 'Claim sent' : 'Unclaimed'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

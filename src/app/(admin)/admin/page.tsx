'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/config';
import { secureFetch } from '@/lib/csrf-client';

interface DashboardStats {
  totalBarbers: number;
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

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBarbers: 0,
    pendingVerifications: 0,
    totalClients: 0,
    totalReviews: 0,
  });
  const [pendingBarbers, setPendingBarbers] = useState<PendingBarber[]>([]);
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await secureFetch('/api/admin/dashboard');
        const json = await res.json();
        if (json.success) {
          setStats(json.data.stats);
          setPendingBarbers(json.data.pendingBarbers);
          setRecentSignups(json.data.recentSignups);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
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
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

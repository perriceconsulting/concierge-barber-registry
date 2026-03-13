'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/config';

export default function AdminDashboardPage() {
  const stats = {
    totalBarbers: 0,
    pendingVerifications: 0,
    totalClients: 0,
    totalReviews: 0,
  };

  const pendingBarbers: Array<{ id: string; name: string; email: string; city: string; submittedAt: string }> = [];
  const recentSignups: Array<{ id: string; name: string; email: string; role: string; date: string }> = [];

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
                    <p className="font-medium">{barber.name}</p>
                    <p className="text-sm text-muted-foreground">{barber.email}</p>
                    <p className="text-xs text-muted-foreground">{barber.city} • {barber.submittedAt}</p>
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
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.date}</p>
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

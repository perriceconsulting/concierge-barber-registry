'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config';
import { secureFetch } from '@/lib/csrf-client';
import NotificationBanners from '@/components/dashboard/notification-banners';
import { ReferralCard } from '@/components/dashboard/referral-card';

interface ContactRequestItem {
  id: string;
  clientName: string;
  serviceInterested: string | null;
  createdAt: string;
  status: string;
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface UserData {
  emailVerified?: boolean;
}

interface ProfileData {
  verificationStatus?: string;
  licenseDocumentUrl?: string | null;
  verificationNotes?: string | null;
  averageRating?: number;
  totalReviews?: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    pendingRequests: 0,
    totalRequests: 0,
  });
  const [recentRequests, setRecentRequests] = useState<ContactRequestItem[]>([]);
  const [recentReviews, setRecentReviews] = useState<ReviewItem[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [meRes, profileRes, requestsRes] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          fetch('/api/barbers/profile', { credentials: 'include' }),
          secureFetch('/api/barbers/requests?status=all'),
        ]);

        if (cancelled) return;

        if (meRes.ok) {
          const meData = await meRes.json();
          setUserData(meData.data?.user || meData.user || null);
        }

        if (profileRes.ok) {
          const profData = await profileRes.json();
          const profile = profData.data?.barberProfile || profData.barberProfile || null;
          setProfileData(profile);

          if (profile) {
            setStats((prev) => ({
              ...prev,
              totalReviews: profile.totalReviews || 0,
              averageRating: profile.averageRating || 0,
            }));
          }
        }

        if (requestsRes.ok) {
          const reqData = await requestsRes.json();
          if (reqData.success) {
            const allRequests: ContactRequestItem[] = reqData.data.requests;
            const reqStats = reqData.data.stats;
            setRecentRequests(allRequests.slice(0, 5));
            setStats((prev) => ({
              ...prev,
              pendingRequests: reqStats.new || 0,
              totalRequests: reqStats.total || 0,
            }));
          }
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();

    // Fetch recent reviews separately (uses the public reviews API)
    async function fetchReviews() {
      try {
        const profileRes = await fetch('/api/barbers/profile', { credentials: 'include' });
        if (!profileRes.ok || cancelled) return;
        const profData = await profileRes.json();
        const profile = profData.data?.barberProfile || profData.barberProfile;
        if (!profile?.slug) return;

        const reviewsRes = await fetch(`/api/barbers/${profile.slug}`);
        if (!reviewsRes.ok || cancelled) return;
        const barberData = await reviewsRes.json();
        const reviews = barberData.data?.barber?.reviews || [];
        if (!cancelled) {
          setRecentReviews(reviews.slice(0, 5));
        }
      } catch {
        // Silently handle
      }
    }

    fetchReviews();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s an overview of your profile activity.
        </p>
      </div>

      <NotificationBanners user={userData} profile={profileData} />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reviews</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? '...' : stats.totalReviews}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Rating</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-1">
              {isLoading ? '...' : stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
              {!isLoading && stats.averageRating > 0 && (
                <span className="text-yellow-400 text-2xl">★</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card className={stats.pendingRequests > 0 ? 'border-amber-300' : ''}>
          <CardHeader className="pb-2">
            <CardDescription>New Requests</CardDescription>
            <CardTitle className={`text-3xl ${stats.pendingRequests > 0 ? 'text-amber-600' : ''}`}>
              {isLoading ? '...' : stats.pendingRequests}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Needs response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? '...' : stats.totalRequests}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Royalties (CBR v2.0) */}
      <ReferralCard />

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Contact Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Contact Requests</CardTitle>
                <CardDescription>Latest client inquiries</CardDescription>
              </div>
              {recentRequests.length > 0 && (
                <Link href={ROUTES.DASHBOARD_REQUESTS}>
                  <Button variant="link" size="sm" className="p-0">View all</Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{request.clientName}</p>
                      {request.serviceInterested && (
                        <p className="text-sm text-muted-foreground">{request.serviceInterested}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={request.status === 'new' ? 'warning' : 'secondary'}>
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent requests</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>What clients are saying</CardDescription>
              </div>
              {recentReviews.length > 0 && (
                <Link href={ROUTES.DASHBOARD_REVIEWS}>
                  <Button variant="link" size="sm" className="p-0">View all</Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : recentReviews.length > 0 ? (
              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <div key={review.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{review.user.firstName} {review.user.lastName}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm font-medium">{review.rating}</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

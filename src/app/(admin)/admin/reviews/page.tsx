'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { StarRating } from '@/components/ui/star-rating';
import { useModal } from '@/components/ui/modal';
import { secureFetch } from '@/lib/csrf-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ADMIN_REVIEWS');

interface ReviewResponse {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  isVisible: boolean;
  barberProfile?: { displayName: string } | null;
  client?: { firstName?: string; lastName?: string } | null;
}

interface Review {
  id: string;
  barberName: string;
  clientName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  isVisible: boolean;
}

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  const [filter, setFilter] = useState<'all' | 'hidden'>('all');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/reviews?filter=${filter}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        const mapped = data.data.reviews.map((r: ReviewResponse) => ({
          id: r.id,
          barberName: r.barberProfile?.displayName || 'Unknown Barber',
          clientName: r.client
            ? `${r.client.firstName || ''} ${r.client.lastName || ''}`.trim()
            : 'Anonymous',
          rating: r.rating,
          title: r.title || '',
          comment: r.comment || '',
          createdAt: new Date(r.createdAt).toLocaleDateString(),
          isVisible: r.isVisible,
        }));
        setReviews(mapped);
      }
    } catch (error) {
      logger.error('Failed to fetch reviews:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filteredReviews = reviews.filter(review => {
    if (filter === 'hidden') return !review.isVisible;
    return true;
  });

  const stats = {
    total: reviews.length,
    hidden: reviews.filter(r => !r.isVisible).length,
    visible: reviews.filter(r => r.isVisible).length,
  };

  const handleHide = async (id: string) => {
    try {
      const res = await secureFetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isVisible: false }),
      });
      const data = await res.json();
      if (data.success) {
        setExpandedReview(null);
        showToast({
          title: 'Success',
          description: 'Review hidden successfully',
          variant: 'success',
        });
        await fetchReviews();
      } else {
        showToast({
          title: 'Error',
          description: data.error?.message || 'Failed to hide review',
          variant: 'error',
        });
      }
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to hide review',
        variant: 'error',
      });
    }
  };

  const handleShow = async (id: string) => {
    try {
      const res = await secureFetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isVisible: true }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({
          title: 'Success',
          description: 'Review made visible',
          variant: 'success',
        });
        await fetchReviews();
      } else {
        showToast({
          title: 'Error',
          description: data.error?.message || 'Failed to show review',
          variant: 'error',
        });
      }
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to show review',
        variant: 'error',
      });
    }
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Delete Review',
      description: 'Are you sure you want to permanently delete this review? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const res = await secureFetch(`/api/admin/reviews/${id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            setExpandedReview(null);
            showToast({
              title: 'Success',
              description: 'Review deleted',
              variant: 'success',
            });
            await fetchReviews();
          } else {
            showToast({
              title: 'Error',
              description: data.error?.message || 'Failed to delete review',
              variant: 'error',
            });
          }
        } catch {
          showToast({
            title: 'Error',
            description: 'Failed to delete review',
            variant: 'error',
          });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-destructive">Moderate Reviews</h1>
          <p className="text-muted-foreground mt-2">
            Manage and moderate platform reviews
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading reviews...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-destructive">Moderate Reviews</h1>
        <p className="text-muted-foreground mt-2">
          Manage and moderate platform reviews
        </p>
      </div>

      {/* Stats — auto-fit so cards reflow when the help drawer is open */}
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reviews</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hidden</CardDescription>
            <CardTitle className="text-3xl">{stats.hidden}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visible</CardDescription>
            <CardTitle className="text-3xl">{stats.visible}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={filter === 'hidden' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('hidden')}
            >
              Hidden ({stats.hidden})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{review.clientName}</CardTitle>
                    {!review.isVisible && (
                      <Badge variant="outline">Hidden</Badge>
                    )}
                  </div>
                  <CardDescription>
                    For: {review.barberName} • {review.createdAt}
                  </CardDescription>
                  <StarRating rating={review.rating} className="mt-2" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {review.title && (
                <h4 className="font-semibold">{review.title}</h4>
              )}
              <p className="text-muted-foreground">{review.comment}</p>

              {expandedReview === review.id ? (
                <div className="space-y-3 p-4 border rounded-md">
                  <Textarea
                    placeholder="Add moderation note (optional)..."
                    value={moderationNote}
                    onChange={(e) => setModerationNote(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2 flex-wrap">
                    {review.isVisible && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleHide(review.id)}
                      >
                        Hide Review
                      </Button>
                    )}
                    {!review.isVisible && (
                      <Button
                        size="sm"
                        onClick={() => handleShow(review.id)}
                      >
                        Show Review
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(review.id)}
                    >
                      Delete Permanently
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setExpandedReview(null);
                        setModerationNote('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setExpandedReview(review.id)}
                >
                  Moderate
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredReviews.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No reviews found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

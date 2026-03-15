'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { UpgradeBanner } from '@/components/subscription/upgrade-banner';
import { secureFetch } from '@/lib/csrf-client';

interface ReviewResponseItem {
  id: string;
  comment: string;
  createdAt: string;
}

interface Review {
  id: string;
  clientName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  isVerified: boolean;
  response?: ReviewResponseItem | null;
}

export default function ReviewsPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [canRespondToReviews, setCanRespondToReviews] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubscriptionInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/barbers/subscription', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const tier = data.data.tier;
          setCanRespondToReviews(tier === 'professional' || tier === 'elite');
        }
      }
    } catch {
      // Default to false
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, [fetchSubscriptionInfo]);

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.rating === parseInt(filter));

  const stats = {
    total: reviews.length,
    average: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
    breakdown: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    },
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await secureFetch(`/api/reviews/${reviewId}/response`, {
        method: 'POST',
        body: JSON.stringify({ comment: replyText }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast({
          title: 'Response posted',
          description: 'Your reply has been published.',
          variant: 'success',
        });
        setReviews(reviews.map(r =>
          r.id === reviewId
            ? { ...r, response: data.data.response }
            : r
        ));
        setReplyingTo(null);
        setReplyText('');
      } else if (data.error?.code === 'TIER_LIMIT_REACHED') {
        showToast({
          title: 'Upgrade Required',
          description: data.error.message,
          variant: 'warning',
        });
      } else {
        showToast({
          title: 'Error',
          description: data.error?.message || 'Failed to post response',
          variant: 'error',
        });
      }
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to post response. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Reviews</h1>
        <p className="text-muted-foreground mt-2">
          See what clients are saying about your services
        </p>
      </div>

      {/* Upgrade banner for review responses */}
      {!canRespondToReviews && reviews.length > 0 && (
        <UpgradeBanner feature="review responses" />
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Average Rating</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
              {stats.average}
              <span className="text-yellow-400 text-3xl">★</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Based on {stats.total} review{stats.total !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.breakdown[rating as keyof typeof stats.breakdown];
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <span className="text-yellow-400">★</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Reviews</CardTitle>
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
            {[5, 4, 3, 2, 1].map((rating) => (
              <Button
                key={rating}
                variant={filter === rating.toString() ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(rating.toString() as typeof filter)}
              >
                {rating} ★ ({stats.breakdown[rating as keyof typeof stats.breakdown]})
              </Button>
            ))}
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
                    {review.isVerified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {review.createdAt}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {review.title && (
                <h4 className="font-semibold">{review.title}</h4>
              )}
              <p className="text-muted-foreground">{review.comment}</p>

              {/* Existing response */}
              {review.response && (
                <div className="ml-4 pl-4 border-l-2 border-primary/20 mt-3">
                  <p className="text-sm font-medium text-primary mb-1">Your Response</p>
                  <p className="text-sm text-muted-foreground">{review.response.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(review.response.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Reply form */}
              {canRespondToReviews && !review.response && (
                <>
                  {replyingTo === review.id ? (
                    <div className="space-y-2 mt-3">
                      <Textarea
                        placeholder="Write your response..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReply(review.id)}
                          disabled={isSubmitting || !replyText.trim()}
                        >
                          {isSubmitting ? 'Posting...' : 'Post Response'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplyingTo(review.id)}
                    >
                      Reply
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredReviews.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No reviews found for this filter
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

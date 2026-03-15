'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useModal } from '@/components/ui/modal';

interface Review {
  id: string;
  barberName: string;
  clientName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  isVisible: boolean;
  isFlagged: boolean;
}

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  const [filter, setFilter] = useState<'all' | 'flagged' | 'hidden'>('all');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [moderationNote, setModerationNote] = useState('');

  const [reviews, setReviews] = useState<Review[]>([]);

  const filteredReviews = reviews.filter(review => {
    if (filter === 'flagged') return review.isFlagged;
    if (filter === 'hidden') return !review.isVisible;
    return true;
  });

  const stats = {
    total: reviews.length,
    flagged: reviews.filter(r => r.isFlagged).length,
    hidden: reviews.filter(r => !r.isVisible).length,
    visible: reviews.filter(r => r.isVisible).length,
  };

  const handleHide = (id: string) => {
    setReviews(reviews.map(r =>
      r.id === id ? { ...r, isVisible: false } : r
    ));
    setExpandedReview(null);
    showToast({
      title: 'Success',
      description: 'Review hidden successfully',
      variant: 'success',
    });
  };

  const handleShow = (id: string) => {
    setReviews(reviews.map(r =>
      r.id === id ? { ...r, isVisible: true } : r
    ));
    showToast({
      title: 'Success',
      description: 'Review made visible',
      variant: 'success',
    });
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Delete Review',
      description: 'Are you sure you want to permanently delete this review? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: () => {
        setReviews(reviews.filter(r => r.id !== id));
        setExpandedReview(null);
        showToast({
          title: 'Success',
          description: 'Review deleted',
          variant: 'success',
        });
      },
    });
  };

  const handleUnflag = (id: string) => {
    setReviews(reviews.map(r =>
      r.id === id ? { ...r, isFlagged: false } : r
    ));
    showToast({
      title: 'Success',
      description: 'Review unflagged',
      variant: 'success',
    });
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-destructive">Moderate Reviews</h1>
        <p className="text-muted-foreground mt-2">
          Manage and moderate platform reviews
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reviews</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-500/50 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardDescription>Flagged</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.flagged}</CardTitle>
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
              variant={filter === 'flagged' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('flagged')}
            >
              Flagged ({stats.flagged})
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
          <Card key={review.id} className={review.isFlagged ? 'border-yellow-500' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{review.clientName}</CardTitle>
                    {review.isFlagged && (
                      <Badge variant="destructive">Flagged</Badge>
                    )}
                    {!review.isVisible && (
                      <Badge variant="outline">Hidden</Badge>
                    )}
                  </div>
                  <CardDescription>
                    For: {review.barberName} • {review.createdAt}
                  </CardDescription>
                  <div className="flex mt-2">{renderStars(review.rating)}</div>
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
                    {review.isFlagged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnflag(review.id)}
                      >
                        Unflag
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

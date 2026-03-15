'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/portfolio/image-uploader';
import { useToast } from '@/components/ui/toast';
import { useModal } from '@/components/ui/modal';
import { secureFetch } from '@/lib/csrf-client';
import { UpgradeBanner } from '@/components/subscription/upgrade-banner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PORTFOLIO');

interface PortfolioImage {
  id: string;
  imageUrl: string;
  caption: string;
  sortOrder: number;
}

export default function PortfolioPage() {
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showCaptionForm, setShowCaptionForm] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [imageLimit, setImageLimit] = useState<number | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const fetchSubscriptionLimits = useCallback(async () => {
    try {
      const response = await fetch('/api/barbers/subscription', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setImageLimit(data.data.usage.portfolioImages.limit);
        }
      }
    } catch {
      // Fall back to no limit display
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
    fetchSubscriptionLimits();
  }, [fetchSubscriptionLimits]);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch('/api/barbers/portfolio', {
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setImages(data.data.images);
      } else if (response.status === 404) {
        // Barber profile doesn't exist yet - show helpful message
        setImages([]);
        showToast({
          title: 'Complete Your Profile',
          description: 'Please complete your barber profile before uploading portfolio images.',
          variant: 'warning',
        });
      } else {
        showToast({
          title: 'Error',
          description: data.message || 'Failed to load portfolio',
          variant: 'error',
        });
      }
    } catch (error) {
      logger.error('Failed to fetch portfolio:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load portfolio. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (dataUrl: string) => {
    try {
      setIsUploading(true);

      const response = await secureFetch('/api/barbers/portfolio', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: dataUrl, caption: '' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast({
          title: 'Success!',
          description: 'Image uploaded successfully!',
          variant: 'success',
        });
        await fetchPortfolio();
      } else if (data.error?.code === 'TIER_LIMIT_REACHED') {
        setUpgradeRequired(true);
        showToast({
          title: 'Limit Reached',
          description: data.error.message,
          variant: 'warning',
        });
      } else {
        showToast({
          title: 'Error',
          description: data.message || data.error?.message || 'Failed to upload image',
          variant: 'error',
        });
      }
    } catch (error) {
      logger.error('Failed to upload image:', error);
      showToast({
        title: 'Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    showConfirm({
      title: 'Delete Image',
      description: 'Are you sure you want to delete this image? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const response = await secureFetch(`/api/barbers/portfolio/${id}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (response.ok && data.success) {
            showToast({
              title: 'Success!',
              description: 'Image deleted successfully!',
              variant: 'success',
            });
            await fetchPortfolio();
          } else {
            showToast({
              title: 'Error',
              description: data.message || 'Failed to delete image',
              variant: 'error',
            });
          }
        } catch (error) {
          logger.error('Failed to delete image:', error);
          showToast({
            title: 'Error',
            description: 'Failed to delete image. Please try again.',
            variant: 'error',
          });
        }
      },
    });
  };

  const handleUpdateCaption = async (id: string) => {
    try {
      const response = await secureFetch(`/api/barbers/portfolio/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ caption }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast({
          title: 'Success!',
          description: 'Caption updated successfully!',
          variant: 'success',
        });
        await fetchPortfolio();
        setShowCaptionForm(null);
        setCaption('');
      } else {
        showToast({
          title: 'Error',
          description: data.message || 'Failed to update caption',
          variant: 'error',
        });
      }
    } catch (error) {
      logger.error('Failed to update caption:', error);
      showToast({
        title: 'Error',
        description: 'Failed to update caption. Please try again.',
        variant: 'error',
      });
    }
  };

  const maxImages = imageLimit ?? 5; // Default to starter tier limit
  const remainingSlots = maxImages - images.length;
  const isAtLimit = remainingSlots <= 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Portfolio</h1>
          <p className="text-muted-foreground mt-2">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Portfolio</h1>
        <p className="text-muted-foreground mt-2">
          Showcase your best work ({images.length}/{maxImages} images)
        </p>
      </div>

      {/* Upgrade Banner */}
      {(isAtLimit || upgradeRequired) && (
        <UpgradeBanner
          feature="portfolio images"
          currentUsage={images.length}
          limit={maxImages}
        />
      )}

      {/* Upload Area */}
      {!isAtLimit && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>
              Drag and drop your image or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploader
              onUpload={handleUpload}
              maxSizeMB={10}
              disabled={isUploading}
            />
          </CardContent>
        </Card>
      )}

      {/* Upload Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>Maximum file size: 10MB per image</li>
            <li>Accepted formats: JPEG, PNG, WebP</li>
            <li>Maximum {maxImages} images total</li>
            <li>Recommended dimensions: 1200x1200 pixels</li>
            <li>High-quality photos showcase your work best</li>
          </ul>
        </CardContent>
      </Card>

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="aspect-square bg-muted relative">
                <Image
                  src={image.imageUrl}
                  alt={image.caption || 'Portfolio image'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <CardContent className="p-4 space-y-3">
                {showCaptionForm === image.id ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Add a caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateCaption(image.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowCaptionForm(null);
                          setCaption('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground min-h-[40px]">
                      {image.caption || 'No caption'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowCaptionForm(image.id);
                          setCaption(image.caption);
                        }}
                      >
                        Edit Caption
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteImage(image.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No portfolio images yet. Use the drag-and-drop area above to upload your first image!
            </p>
          </CardContent>
        </Card>
      )}

      {remainingSlots > 0 && images.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          You can upload {remainingSlots} more {remainingSlots === 1 ? 'image' : 'images'}
        </p>
      )}
    </div>
  );
}

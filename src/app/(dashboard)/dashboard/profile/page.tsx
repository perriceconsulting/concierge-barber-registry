'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';
import { LicenseUploader } from '@/components/barber/license-uploader';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PROFILE');

export default function ProfilePage() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    tagline: '',
    yearsExperience: 0,
    licenseNumber: '',
    licenseState: '',
    licenseExpirationDate: '',
    shopName: '',
    shopAddressLine1: '',
    shopAddressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    websiteUrl: '',
    instagramHandle: '',
    offersMobileService: false,
    mobileServiceRadiusMiles: 0,
    acceptsWalkins: true,
    acceptsAppointments: true,
  });

  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | 'suspended'>('pending');
  const [licenseDocumentUrl, setLicenseDocumentUrl] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsFetching(true);

      const response = await fetch('/api/barbers/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.barberProfile) {
          const profile = data.data.barberProfile;
          setFormData({
            displayName: profile.displayName || '',
            bio: profile.bio || '',
            tagline: profile.tagline || '',
            yearsExperience: profile.yearsExperience || 0,
            licenseNumber: profile.licenseNumber || '',
            licenseState: profile.licenseState || '',
            licenseExpirationDate: profile.licenseExpirationDate ? new Date(profile.licenseExpirationDate).toISOString().split('T')[0] : '',
            shopName: profile.shopName || '',
            shopAddressLine1: profile.shopAddressLine1 || '',
            shopAddressLine2: profile.shopAddressLine2 || '',
            city: profile.city || '',
            state: profile.state || '',
            zipCode: profile.zipCode || '',
            websiteUrl: profile.websiteUrl || '',
            instagramHandle: profile.instagramHandle || '',
            offersMobileService: profile.offersMobileService ?? false,
            mobileServiceRadiusMiles: profile.mobileServiceRadiusMiles || 0,
            acceptsWalkins: profile.acceptsWalkins ?? true,
            acceptsAppointments: profile.acceptsAppointments ?? true,
          });
          setVerificationStatus(profile.verificationStatus || 'pending');
          setLicenseDocumentUrl(profile.licenseDocumentUrl || '');
        }
      } else if (response.status === 404) {
        // Profile doesn't exist yet - this is normal for new barbers
        // Leave form with default empty values
        setError(null);
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      logger.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await secureFetch('/api/barbers/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          title: 'Success!',
          description: data.message || 'Profile updated successfully!',
          variant: 'success',
        });
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      logger.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Edit Profile</h1>
          <p className="text-muted-foreground mt-2">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Determine profile type for helpful messaging
  const isShopBased = formData.shopName && formData.shopAddressLine1;
  const isMobileOnly = formData.offersMobileService && !formData.shopAddressLine1;
  const isIndependent = !formData.shopName;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Edit Profile</h1>
        <p className="text-muted-foreground mt-2">
          Update your professional information and business details
        </p>
        {isIndependent && !isMobileOnly && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline">Independent Barber</Badge>
            <span className="text-xs text-muted-foreground">
              Working solo without a shop location
            </span>
          </div>
        )}
        {isMobileOnly && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline">Mobile Barber</Badge>
            <span className="text-xs text-muted-foreground">
              Offering on-site services
            </span>
          </div>
        )}
        {isShopBased && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline">Shop-Based</Badge>
            <span className="text-xs text-muted-foreground">
              Working at {formData.shopName}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your professional identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="Your signature phrase"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                placeholder="Tell clients about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                min={0}
                value={formData.yearsExperience}
                onChange={(e) => setFormData({ ...formData, yearsExperience: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional License */}
        <Card>
          <CardHeader>
            <CardTitle>Professional License Information</CardTitle>
            <CardDescription>
              Required for verification as a licensed professional
              {verificationStatus && (
                <Badge className="ml-2" variant={
                  verificationStatus === 'approved' ? 'default' :
                  verificationStatus === 'rejected' ? 'destructive' :
                  verificationStatus === 'suspended' ? 'destructive' :
                  'secondary'
                }>
                  {verificationStatus === 'approved' && '✓ Verified'}
                  {verificationStatus === 'pending' && '⏳ Pending Review'}
                  {verificationStatus === 'rejected' && '✗ Rejected'}
                  {verificationStatus === 'suspended' && '⚠ Suspended'}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="Enter your professional license number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseState">License State *</Label>
              <Input
                id="licenseState"
                maxLength={2}
                placeholder="NY"
                value={formData.licenseState}
                onChange={(e) => setFormData({ ...formData, licenseState: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseExpirationDate">License Expiration Date *</Label>
              <Input
                id="licenseExpirationDate"
                type="date"
                value={formData.licenseExpirationDate}
                onChange={(e) => setFormData({ ...formData, licenseExpirationDate: e.target.value })}
                required
              />
            </div>

            <LicenseUploader
              currentDocumentUrl={licenseDocumentUrl}
              onUploadSuccess={(url) => {
                setLicenseDocumentUrl(url);
                showToast({
                  title: 'Success!',
                  description: 'License document uploaded successfully',
                  variant: 'success',
                });
              }}
              onUploadError={(errorMsg) => {
                showToast({
                  title: 'Upload Failed',
                  description: errorMsg,
                  variant: 'error',
                });
              }}
            />
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Where clients can find you (city/state required, shop details optional for independent barbers)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop/Business Name (Optional)</Label>
              <Input
                id="shopName"
                placeholder="Leave blank if you're an independent barber"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                If you work at a barbershop, enter the shop name. If you&apos;re independent or mobile, you can leave this blank.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopAddressLine1">Street Address (Optional)</Label>
              <Input
                id="shopAddressLine1"
                placeholder="Shop address (optional for mobile/independent barbers)"
                value={formData.shopAddressLine1}
                onChange={(e) => setFormData({ ...formData, shopAddressLine1: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopAddressLine2">Address Line 2</Label>
              <Input
                id="shopAddressLine2"
                placeholder="Apt, Suite, etc. (optional)"
                value={formData.shopAddressLine2}
                onChange={(e) => setFormData({ ...formData, shopAddressLine2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  maxLength={2}
                  placeholder="NY"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Mobile Service */}
        <Card>
          <CardHeader>
            <CardTitle>Mobile Service</CardTitle>
            <CardDescription>Do you offer mobile/on-site services?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="offersMobileService"
                checked={formData.offersMobileService}
                onChange={(e) => setFormData({ ...formData, offersMobileService: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="offersMobileService">I offer mobile/on-site services</Label>
            </div>

            {formData.offersMobileService && (
              <div className="space-y-2">
                <Label htmlFor="mobileServiceRadiusMiles">Service Radius (miles)</Label>
                <Input
                  id="mobileServiceRadiusMiles"
                  type="number"
                  min={0}
                  max={500}
                  placeholder="e.g., 25"
                  value={formData.mobileServiceRadiusMiles || ''}
                  onChange={(e) => setFormData({ ...formData, mobileServiceRadiusMiles: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  How far are you willing to travel for mobile appointments?
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact & Social */}
        <Card>
          <CardHeader>
            <CardTitle>Contact & Social Media</CardTitle>
            <CardDescription>How clients can reach you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://..."
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramHandle">Instagram Handle</Label>
              <Input
                id="instagramHandle"
                placeholder="@username"
                value={formData.instagramHandle}
                onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>How you accept clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="acceptsWalkins"
                checked={formData.acceptsWalkins}
                onChange={(e) => setFormData({ ...formData, acceptsWalkins: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="acceptsWalkins">Accept Walk-ins</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="acceptsAppointments"
                checked={formData.acceptsAppointments}
                onChange={(e) => setFormData({ ...formData, acceptsAppointments: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="acceptsAppointments">Accept Appointments</Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

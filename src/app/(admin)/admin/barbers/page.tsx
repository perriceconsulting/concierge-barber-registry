'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

interface Barber {
  id: string;
  displayName: string;
  email: string;
  city: string;
  state: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  submittedAt: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function AdminBarbersPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBarbers();
  }, [filter, searchQuery]);

  const fetchBarbers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (filter !== 'all') params.append('status', filter);

      const token = localStorage.getItem('accessToken');

      const response = await fetch(`/api/admin/barbers?${params.toString()}`, {
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBarbers(data.data.barbers.map((b: any) => ({
          id: b.id,
          displayName: b.displayName,
          email: b.user?.email || '',
          city: b.city,
          state: b.state,
          verificationStatus: b.verificationStatus,
          submittedAt: new Date(b.createdAt).toLocaleDateString(),
          user: b.user,
        })));
      } else {
        setError(data.message || 'Failed to fetch barbers');
      }
    } catch (err) {
      console.error('Failed to fetch barbers:', err);
      setError('Failed to load barbers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBarbers = barbers.filter(barber => {
    const matchesFilter = filter === 'all' || barber.verificationStatus === filter;
    const matchesSearch = searchQuery === '' ||
      barber.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barber.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`/api/admin/barbers/${id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'approved' }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          title: 'Success!',
          description: data.message || 'Barber approved successfully!',
          variant: 'success',
        });
        fetchBarbers();
      } else {
        showToast({
          title: 'Error',
          description: data.message || 'Failed to approve barber',
          variant: 'error',
        });
      }
    } catch (err) {
      console.error('Failed to approve barber:', err);
      showToast({
        title: 'Error',
        description: 'Failed to approve barber. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        const token = localStorage.getItem('accessToken');

        const response = await fetch(`/api/admin/barbers/${id}/verify`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ status: 'rejected', notes: reason }),
        });

        const data = await response.json();

        if (response.ok) {
          showToast({
            title: 'Success!',
            description: data.message || 'Barber rejected successfully!',
            variant: 'success',
          });
          fetchBarbers();
        } else {
          showToast({
            title: 'Error',
            description: data.message || 'Failed to reject barber',
            variant: 'error',
          });
        }
      } catch (err) {
        console.error('Failed to reject barber:', err);
        showToast({
          title: 'Error',
          description: 'Failed to reject barber. Please try again.',
          variant: 'error',
        });
      }
    }
  };

  const handleSuspend = async (id: string) => {
    if (confirm('Are you sure you want to suspend this barber?')) {
      try {
        const token = localStorage.getItem('accessToken');

        const response = await fetch(`/api/admin/barbers/${id}/verify`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ status: 'suspended' }),
        });

        const data = await response.json();

        if (response.ok) {
          showToast({
            title: 'Success!',
            description: data.message || 'Barber suspended successfully!',
            variant: 'success',
          });
          fetchBarbers();
        } else {
          showToast({
            title: 'Error',
            description: data.message || 'Failed to suspend barber',
            variant: 'error',
          });
        }
      } catch (err) {
        console.error('Failed to suspend barber:', err);
        showToast({
          title: 'Error',
          description: 'Failed to suspend barber. Please try again.',
          variant: 'error',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-destructive">Manage Barbers</h1>
          <p className="text-muted-foreground mt-2">Loading barbers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-destructive">Manage Barbers</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage barber profiles
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
              >
                Approved
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('rejected')}
              >
                Rejected
              </Button>
              <Button
                variant={filter === 'suspended' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('suspended')}
              >
                Suspended
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {filteredBarbers.length} barber{filteredBarbers.length !== 1 ? 's' : ''} found
        </p>

        <div className="space-y-4">
          {filteredBarbers.map((barber) => (
            <Card key={barber.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{barber.displayName}</CardTitle>
                    <CardDescription>
                      {barber.email} • {barber.city}, {barber.state}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted: {barber.submittedAt}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(barber.verificationStatus)}>
                    {barber.verificationStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {barber.verificationStatus === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(barber.id)}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(barber.id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {barber.verificationStatus === 'approved' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleSuspend(barber.id)}
                    >
                      Suspend
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredBarbers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No barbers found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useModal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { secureFetch } from '@/lib/csrf-client';
import { UpgradeBanner } from '@/components/subscription/upgrade-banner';

interface Service {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
}

export default function ServicesPage() {
  const { showConfirm } = useModal();
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceLimit, setServiceLimit] = useState<number | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      const res = await secureFetch('/api/barbers/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.data.services);
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to load services', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    let cancelled = false;
    async function fetchServiceLimit() {
      try {
        const response = await fetch('/api/barbers/subscription', { credentials: 'include' });
        if (response.ok && !cancelled) {
          const data = await response.json();
          if (data.success) {
            setServiceLimit(data.data.usage.services.limit);
          }
        }
      } catch {
        // Fall back to no limit display
      }
    }
    fetchServiceLimit();
    return () => { cancelled = true; };
  }, []);

  const maxServices = serviceLimit ?? 3;
  const isAtLimit = services.length >= maxServices;

  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
  });

  const handleAddService = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', price: '', duration: '' });
    setShowForm(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: (service.priceCents / 100).toString(),
      duration: service.durationMinutes.toString(),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const serviceData = {
      name: formData.name,
      description: formData.description || undefined,
      priceCents: Math.round(parseFloat(formData.price) * 100),
      durationMinutes: parseInt(formData.duration),
      isActive: true,
    };

    try {
      let res;
      if (editingService) {
        res = await secureFetch(`/api/barbers/services/${editingService.id}`, {
          method: 'PATCH',
          body: JSON.stringify(serviceData),
        });
      } else {
        res = await secureFetch('/api/barbers/services', {
          method: 'POST',
          body: JSON.stringify(serviceData),
        });
      }

      const data = await res.json();
      if (data.success) {
        showToast({
          title: 'Success',
          description: editingService ? 'Service updated' : 'Service added',
          variant: 'success',
        });
        setShowForm(false);
        setEditingService(null);
        setFormData({ name: '', description: '', price: '', duration: '' });
        fetchServices();
      } else {
        showToast({
          title: 'Error',
          description: data.error?.message || 'Failed to save service',
          variant: 'error',
        });
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to save service', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Delete Service',
      description: 'Are you sure you want to delete this service? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const res = await secureFetch(`/api/barbers/services/${id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            showToast({ title: 'Deleted', description: 'Service removed', variant: 'success' });
            fetchServices();
          } else {
            showToast({ title: 'Error', description: data.error?.message || 'Failed to delete', variant: 'error' });
          }
        } catch {
          showToast({ title: 'Error', description: 'Failed to delete service', variant: 'error' });
        }
      },
    });
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const res = await secureFetch(`/api/barbers/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchServices();
      }
    } catch {
      showToast({ title: 'Error', description: 'Failed to update service', variant: 'error' });
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-heading">Services</h1>
        <p className="text-muted-foreground">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-heading">Services</h1>
          <p className="text-muted-foreground mt-2">
            Manage the services you offer ({services.length}/{maxServices})
          </p>
        </div>
        {!showForm && !isAtLimit && (
          <Button onClick={handleAddService}>Add Service</Button>
        )}
      </div>

      {isAtLimit && (
        <UpgradeBanner
          feature="services"
          currentUsage={services.length}
          limit={maxServices}
        />
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingService ? 'Edit Service' : 'Add New Service'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Classic Fade"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this service..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="35.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="45"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingService ? 'Update Service' : 'Add Service'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingService(null);
                    setFormData({ name: '', description: '', price: '', duration: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <div className="space-y-4">
        {services.map((service) => (
          <Card key={service.id} className={!service.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {service.name}
                    {service.isActive
                      ? <Badge variant="secondary">Active</Badge>
                      : <Badge variant="outline">Inactive</Badge>
                    }
                  </CardTitle>
                  {service.description && (
                    <CardDescription className="mt-1">
                      {service.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(service)}
                  >
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditService(service)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Price:</span>{' '}
                  <span className="font-semibold">{formatPrice(service.priceCents)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>{' '}
                  <span className="font-semibold">{service.durationMinutes} min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {services.length === 0 && !showForm && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No services added yet</p>
              <Button onClick={handleAddService}>Add Your First Service</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { useModal } from '@/components/ui/modal';
import { secureFetch } from '@/lib/csrf-client';

interface Specialty {
  id: number;
  name: string;
  slug: string;
  icon: string;
  barberCount?: number;
}

export default function AdminSpecialtiesPage() {
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  const [showForm, setShowForm] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
  });

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/specialties', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setSpecialties(data.data);
      }
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to load specialties',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setEditingSpecialty(null);
    setFormData({ name: '', slug: '', icon: '' });
    setShowForm(true);
  };

  const handleEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setFormData({
      name: specialty.name,
      slug: specialty.slug,
      icon: specialty.icon || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEdit = !!editingSpecialty;
    const url = isEdit
      ? `/api/admin/specialties/${editingSpecialty!.id}`
      : '/api/admin/specialties';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const response = await secureFetch(url, {
        method,
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!data.success) {
        showToast({
          title: 'Error',
          description: data.error?.message || `Failed to ${isEdit ? 'update' : 'create'} specialty`,
          variant: 'error',
        });
        return;
      }

      showToast({
        title: 'Success',
        description: `Specialty ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });
      setShowForm(false);
      setFormData({ name: '', slug: '', icon: '' });
      await fetchSpecialties();
    } catch {
      showToast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'error',
      });
    }
  };

  const handleDelete = (id: number, barberCount: number = 0) => {
    if (barberCount > 0) {
      showToast({
        title: 'Cannot Delete',
        description: `Cannot delete specialty with ${barberCount} active barbers. Remove barbers first.`,
        variant: 'error',
      });
      return;
    }

    showConfirm({
      title: 'Delete Specialty',
      description: 'Are you sure you want to delete this specialty? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const response = await secureFetch(`/api/admin/specialties/${id}`, {
            method: 'DELETE',
          });
          const data = await response.json();

          if (!data.success) {
            showToast({
              title: 'Error',
              description: data.error?.message || 'Failed to delete specialty',
              variant: 'error',
            });
            return;
          }

          showToast({
            title: 'Success',
            description: 'Specialty deleted successfully',
            variant: 'success',
          });
          await fetchSpecialties();
        } catch {
          showToast({
            title: 'Error',
            description: 'An unexpected error occurred',
            variant: 'error',
          });
        }
      },
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-destructive">Manage Specialties</h1>
          <p className="text-muted-foreground mt-2">
            Add, edit, or remove barber specialty categories
          </p>
        </div>
        {!showForm && (
          <Button onClick={handleAdd}>Add Specialty</Button>
        )}
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Specialties</p>
              <p className="text-2xl font-bold">{specialties.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Most Popular</p>
              <p className="text-2xl font-bold">
                {specialties.length > 0 ? specialties.reduce((max, s) =>
                  (s.barberCount || 0) > (max.barberCount || 0) ? s : max
                ).name : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Barbers</p>
              <p className="text-2xl font-bold">
                {specialties.reduce((sum, s) => sum + (s.barberCount || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSpecialty ? 'Edit Specialty' : 'Add New Specialty'}</CardTitle>
            <CardDescription>
              {editingSpecialty ? 'Update specialty details' : 'Create a new specialty category'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  placeholder="e.g., Fades"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., fades"
                  required
                  pattern="[a-z0-9-]+"
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (lowercase letters, numbers, and hyphens only)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Optional)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., ✂️"
                  maxLength={2}
                />
                <p className="text-xs text-muted-foreground">
                  Single emoji character
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingSpecialty ? 'Update Specialty' : 'Create Specialty'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSpecialty(null);
                    setFormData({ name: '', slug: '', icon: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Specialties List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Specialties</h2>
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading specialties...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {specialties.map((specialty) => (
              <Card key={specialty.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {specialty.icon && (
                        <span className="text-2xl">{specialty.icon}</span>
                      )}
                      <div>
                        <CardTitle>{specialty.name}</CardTitle>
                        <CardDescription>
                          Slug: {specialty.slug}
                          {specialty.barberCount !== undefined && (
                            <> • {specialty.barberCount} barber{specialty.barberCount !== 1 ? 's' : ''}</>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(specialty)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(specialty.id, specialty.barberCount)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {specialties.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No specialties created yet</p>
                  <Button onClick={handleAdd}>Add Your First Specialty</Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useModal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { secureFetch } from '@/lib/csrf-client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'barber' | 'admin' | 'hnwi';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  const [filter, setFilter] = useState<'all' | 'client' | 'barber' | 'admin' | 'hnwi'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (filter !== 'all') params.set('role', filter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        showToast({
          title: 'Error',
          description: data.error?.message || 'Failed to fetch users',
          variant: 'error',
        });
      }
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filter, statusFilter, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const stats = {
    total: pagination?.total ?? users.length,
    clients: users.filter(u => u.role === 'client').length,
    barbers: users.filter(u => u.role === 'barber').length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'barber': return 'default';
      case 'client': return 'secondary';
      case 'hnwi': return 'success';
      default: return 'secondary';
    }
  };

  const handleDeactivate = (id: string) => {
    showConfirm({
      title: 'Deactivate User',
      description: 'Are you sure you want to deactivate this user? They will not be able to log in.',
      confirmText: 'Deactivate',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const res = await secureFetch(`/api/admin/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive: false }),
          });
          const data = await res.json();

          if (data.success) {
            showToast({
              title: 'Success',
              description: 'User deactivated successfully',
              variant: 'success',
            });
            fetchUsers();
          } else {
            showToast({
              title: 'Error',
              description: data.error?.message || 'Failed to deactivate user',
              variant: 'error',
            });
          }
        } catch {
          showToast({
            title: 'Error',
            description: 'Failed to deactivate user',
            variant: 'error',
          });
        }
      },
    });
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await secureFetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      });
      const data = await res.json();

      if (data.success) {
        showToast({
          title: 'Success',
          description: 'User activated successfully',
          variant: 'success',
        });
        fetchUsers();
      } else {
        showToast({
          title: 'Error',
          description: data.error?.message || 'Failed to activate user',
          variant: 'error',
        });
      }
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to activate user',
        variant: 'error',
      });
    }
  };

  const [roleChangeUser, setRoleChangeUser] = useState<{ id: string; currentRole: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  const handleChangeRole = (user: User) => {
    setRoleChangeUser({ id: user.id, currentRole: user.role });
    setSelectedRole(user.role);
  };

  const submitRoleChange = async () => {
    if (!roleChangeUser || selectedRole === roleChangeUser.currentRole) return;
    try {
      const res = await secureFetch(`/api/admin/users/${roleChangeUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();

      if (data.success) {
        showToast({
          title: 'Success',
          description: `User role changed to ${selectedRole}`,
          variant: 'success',
        });
        fetchUsers();
      } else {
        showToast({
          title: 'Error',
          description: data.error?.message || 'Failed to change role',
          variant: 'error',
        });
      }
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to change role',
        variant: 'error',
      });
    }
    setRoleChangeUser(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-destructive">Manage Users</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all platform users
        </p>
      </div>

      {/* Stats — auto-fit so cards reflow when the help drawer is open */}
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clients</CardDescription>
            <CardTitle className="text-3xl">{stats.clients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Barbers</CardDescription>
            <CardTitle className="text-3xl">{stats.barbers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-3xl">{stats.admins}</CardTitle>
          </CardHeader>
        </Card>
      </div>

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
            <label className="text-sm font-medium">Role</label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'client' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('client')}
              >
                Clients
              </Button>
              <Button
                variant={filter === 'barber' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('barber')}
              >
                Barbers
              </Button>
              <Button
                variant={filter === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('admin')}
              >
                Admins
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {loading ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''} found`}
        </p>

        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading users...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {users.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle>{user.firstName} {user.lastName}</CardTitle>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                          {!user.isActive && <Badge variant="outline">Inactive</Badge>}
                          {!user.emailVerified && <Badge variant="outline">Unverified</Badge>}
                        </div>
                        <CardDescription>
                          {user.email} • Joined {new Date(user.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {user.isActive ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeactivate(user.id)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleActivate(user.id)}
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChangeRole(user)}
                      >
                        Change Role
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {users.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No users found</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Role Change Dialog */}
      {roleChangeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Change User Role</CardTitle>
              <CardDescription>Select a new role for this user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="client">Client</option>
                <option value="barber">Barber</option>
                <option value="admin">Admin</option>
                <option value="hnwi">HNWI (Black Label)</option>
              </Select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRoleChangeUser(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={submitRoleChange}
                  disabled={selectedRole === roleChangeUser.currentRole}
                >
                  Change Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

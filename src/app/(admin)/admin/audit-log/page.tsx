'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string;
  actorEmail: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export default function AdminAuditLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const auditLogs: AuditLogEntry[] = [];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action.startsWith(actionFilter);

    return matchesSearch && matchesAction;
  });

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'barber', label: 'Barber Actions' },
    { value: 'user', label: 'User Actions' },
    { value: 'review', label: 'Review Actions' },
    { value: 'specialty', label: 'Specialty Actions' },
  ];

  const getActionBadgeVariant = (action: string): any => {
    if (action.includes('approved') || action.includes('created')) return 'default';
    if (action.includes('rejected') || action.includes('banned') || action.includes('deleted')) return 'destructive';
    if (action.includes('hidden') || action.includes('suspended')) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-destructive">Audit Log</h1>
        <p className="text-muted-foreground mt-2">
          Track all administrative actions and system events
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-3xl">{auditLogs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-3xl">
              {auditLogs.filter(l => l.createdAt.startsWith('2026-03-13')).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Barber Actions</CardDescription>
            <CardTitle className="text-3xl">
              {auditLogs.filter(l => l.action.startsWith('barber')).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>User Actions</CardDescription>
            <CardTitle className="text-3xl">
              {auditLogs.filter(l => l.action.startsWith('user')).length}
            </CardTitle>
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
              placeholder="Search by action, actor, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Action Type</label>
            <div className="flex gap-2 flex-wrap">
              {actionTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={actionFilter === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActionFilter(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {filteredLogs.length} event{filteredLogs.length !== 1 ? 's' : ''} found
        </p>

        {filteredLogs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {log.entityType}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{log.details}</CardTitle>
                  <CardDescription className="mt-1">
                    By {log.actorName} ({log.actorEmail})
                  </CardDescription>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{log.createdAt}</p>
                  <p className="text-xs mt-1">{log.ipAddress}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Entity ID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{log.entityId}</code></p>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredLogs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No audit log entries found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

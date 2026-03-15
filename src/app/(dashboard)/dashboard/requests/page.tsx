'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

interface ContactRequest {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  message: string;
  serviceInterested: string;
  preferredDate: string;
  preferredTime: string;
  status: 'new' | 'read' | 'responded' | 'archived';
  createdAt: string;
}

export default function RequestsPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'responded' | 'archived'>('all');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [requests, setRequests] = useState<ContactRequest[]>([]);

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const stats = {
    total: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    read: requests.filter(r => r.status === 'read').length,
    responded: requests.filter(r => r.status === 'responded').length,
    archived: requests.filter(r => r.status === 'archived').length,
  };

  const handleMarkAsRead = (id: string) => {
    setRequests(requests.map(r =>
      r.id === id && r.status === 'new' ? { ...r, status: 'read' } : r
    ));
  };

  const handleRespond = (id: string) => {
    // TODO: Implement actual email/notification sending
    showToast({
      title: 'Response Sent',
      description: 'Your response has been sent to the client.',
      variant: 'success',
    });
    setRequests(requests.map(r =>
      r.id === id ? { ...r, status: 'responded' } : r
    ));
    setExpandedRequest(null);
    setResponseMessage('');
  };

  const handleArchive = (id: string) => {
    setRequests(requests.map(r =>
      r.id === id ? { ...r, status: 'archived' } : r
    ));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      new: 'default',
      read: 'secondary',
      responded: 'outline',
      archived: 'outline',
    };

    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Contact Requests</h1>
        <p className="text-muted-foreground mt-2">
          Manage client inquiries and booking requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New</CardDescription>
            <CardTitle className="text-3xl">{stats.new}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Read</CardDescription>
            <CardTitle className="text-3xl">{stats.read}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Responded</CardDescription>
            <CardTitle className="text-3xl">{stats.responded}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Archived</CardDescription>
            <CardTitle className="text-3xl">{stats.archived}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Requests</CardTitle>
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
              variant={filter === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('new')}
            >
              New ({stats.new})
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('read')}
            >
              Read ({stats.read})
            </Button>
            <Button
              variant={filter === 'responded' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('responded')}
            >
              Responded ({stats.responded})
            </Button>
            <Button
              variant={filter === 'archived' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('archived')}
            >
              Archived ({stats.archived})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{request.clientName}</CardTitle>
                    {getStatusBadge(request.status)}
                  </div>
                  <CardDescription>
                    {request.clientEmail} • {request.clientPhone}
                  </CardDescription>
                  <p className="text-sm text-muted-foreground mt-1">
                    Received: {request.createdAt}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Service:</span>{' '}
                  <span className="font-medium">{request.serviceInterested}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Preferred Date:</span>{' '}
                  <span className="font-medium">{request.preferredDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Preferred Time:</span>{' '}
                  <span className="font-medium">{request.preferredTime}</span>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{request.message}</p>
              </div>

              {expandedRequest === request.id ? (
                <div className="space-y-3 p-4 border rounded-md">
                  <Textarea
                    placeholder="Type your response..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleRespond(request.id)}>
                      Send Response
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setExpandedRequest(null);
                        setResponseMessage('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {request.status === 'new' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsRead(request.id)}
                    >
                      Mark as Read
                    </Button>
                  )}
                  {(request.status === 'new' || request.status === 'read') && (
                    <Button
                      size="sm"
                      onClick={() => setExpandedRequest(request.id)}
                    >
                      Respond
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleArchive(request.id)}
                  >
                    Archive
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No requests found for this filter
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

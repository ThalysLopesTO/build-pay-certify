
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Inbox, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { useMaterialRequestsAdmin } from '@/hooks/useMaterialRequestsAdmin';
import MaterialRequestFilters from './MaterialRequestFilters';
import MaterialRequestItem from './MaterialRequestItem';

const MaterialRequestInbox = () => {
  const {
    requests,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedRequest,
    setSelectedRequest,
    handleStatusUpdate
  } = useMaterialRequestsAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
          <p>Loading material requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isPermissionError = error.message?.includes('permission denied') || 
                             error.message?.includes('RLS') ||
                             error.message?.includes('not allowed');

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Inbox className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Material Request Inbox</h2>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isPermissionError ? (
              <div className="space-y-2">
                <p className="font-semibold">Permission Error</p>
                <p>You currently don't have permission to view this data. This may be due to:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Missing admin role permissions</li>
                  <li>Database Row Level Security (RLS) policies</li>
                  <li>Insufficient access to linked data (Users, Jobsites)</li>
                </ul>
                <p className="text-sm mt-2">Please contact your system administrator to resolve this issue.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold">Error Loading Material Requests</p>
                <p>We're having trouble loading the material requests. Error: {error.message}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Inbox className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Material Request Inbox</h2>
          <Badge variant="secondary">{requests.length} requests</Badge>
        </div>
      </div>

      {/* Filters */}
      <MaterialRequestFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Requests List */}
      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Inbox className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Material Requests Found</h3>
              <p>
                {searchTerm || statusFilter !== 'all' 
                  ? 'No requests match your current filters.' 
                  : 'No material requests have been submitted yet.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((request) => (
                <MaterialRequestItem
                  key={request.id}
                  request={request}
                  selectedRequest={selectedRequest}
                  setSelectedRequest={setSelectedRequest}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestInbox;

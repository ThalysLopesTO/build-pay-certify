
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Inbox, Package } from 'lucide-react';
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
          <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Loading material requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          <Package className="h-8 w-8 mx-auto mb-2" />
          <p>Error loading material requests: {error.message}</p>
        </div>
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
            <div className="text-center py-8 text-gray-500">
              <Inbox className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No material requests found</p>
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

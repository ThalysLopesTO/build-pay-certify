
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Inbox, Search, Filter, Eye, Package, Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';

type RequestStatus = 'pending' | 'ordered' | 'delivered' | 'archived';

interface MaterialRequest {
  id: string;
  jobsites: {
    name: string;
    address: string;
  };
  delivery_date: string;
  delivery_time: string;
  floor_unit: string;
  material_list: string;
  status: RequestStatus;
  created_at: string;
  submitted_by: string;
}

const MaterialRequestInbox = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);

  // Fetch material requests for admin
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['admin-material-requests'],
    queryFn: async () => {
      console.log('Fetching material requests for admin...');
      
      const { data, error } = await supabase
        .from('material_requests')
        .select(`
          *,
          jobsites(name, address)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching material requests:', error);
        throw error;
      }

      console.log('Fetched material requests:', data);
      return data as MaterialRequest[];
    },
  });

  // Update request status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
      const { error } = await supabase
        .from('material_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-material-requests'] });
      toast({
        title: 'Status Updated',
        description: 'Material request status has been updated.',
      });
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.jobsites?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.submitted_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <Badge variant="secondary">{filteredRequests.length} requests</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Requests</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by jobsite or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardContent className="p-0">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Inbox className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No material requests found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredRequests.map((request) => (
                <div key={request.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{request.jobsites?.name || 'Unknown Jobsite'}</h3>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(request.delivery_date), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Package className="h-4 w-4" />
                          <span>{request.delivery_time}</span>
                        </div>
                        {request.floor_unit && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{request.floor_unit}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>Submitted {format(new Date(request.created_at), 'MMM dd')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Material Request Details</DialogTitle>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="font-semibold">Jobsite:</label>
                                  <p>{selectedRequest.jobsites?.name || 'Unknown Jobsite'}</p>
                                  <p className="text-sm text-gray-600">{selectedRequest.jobsites?.address}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">Delivery:</label>
                                  <p>{format(new Date(selectedRequest.delivery_date), 'MMMM dd, yyyy')}</p>
                                  <p className="text-sm text-gray-600">{selectedRequest.delivery_time}</p>
                                </div>
                              </div>
                              
                              {selectedRequest.floor_unit && (
                                <div>
                                  <label className="font-semibold">Floor/Unit:</label>
                                  <p>{selectedRequest.floor_unit}</p>
                                </div>
                              )}

                              <div>
                                <label className="font-semibold">Submitted by:</label>
                                <p className="text-sm text-gray-600">User ID: {selectedRequest.submitted_by}</p>
                              </div>
                              
                              <div>
                                <label className="font-semibold">Material List:</label>
                                <div className="mt-2 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                                  {selectedRequest.material_list}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <label className="font-semibold">Update Status:</label>
                                <Select
                                  value={selectedRequest.status}
                                  onValueChange={(value: RequestStatus) => {
                                    updateStatusMutation.mutate({
                                      id: selectedRequest.id,
                                      status: value
                                    });
                                    setSelectedRequest({ ...selectedRequest, status: value });
                                  }}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="ordered">Ordered</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Select
                        value={request.status}
                        onValueChange={(value: RequestStatus) =>
                          updateStatusMutation.mutate({ id: request.id, status: value })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="ordered">Ordered</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestInbox;

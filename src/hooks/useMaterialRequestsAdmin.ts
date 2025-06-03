
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MaterialRequest, RequestStatus } from '@/components/admin/types/materialRequest';

export const useMaterialRequestsAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);

  // Fetch material requests for admin - no reference to users table
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['admin-material-requests'],
    queryFn: async () => {
      console.log('Fetching material requests for admin...');
      
      const { data, error } = await supabase
        .from('material_requests')
        .select(`
          id,
          delivery_date,
          delivery_time,
          floor_unit,
          material_list,
          status,
          created_at,
          submitted_by,
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

  const handleStatusUpdate = (id: string, status: RequestStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  return {
    requests: filteredRequests,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedRequest,
    setSelectedRequest,
    handleStatusUpdate
  };
};

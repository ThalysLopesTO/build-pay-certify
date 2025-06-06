import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MaterialRequest, RequestStatus } from '@/components/admin/types/materialRequest';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useMaterialRequestsAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);

  // Fetch material requests for admin with company isolation
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['admin-material-requests', user?.companyId],
    queryFn: async () => {
      console.log('Fetching material requests for admin...');
      
      if (!user?.companyId) {
        console.log('No company ID available');
        return [];
      }

      // First, get the material requests with jobsite data
      const { data: materialRequests, error: requestsError } = await supabase
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
          company_id,
          jobsite_id
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching material requests:', requestsError);
        throw requestsError;
      }

      if (!materialRequests || materialRequests.length === 0) {
        console.log('No material requests found');
        return [];
      }

      // Get unique jobsite IDs and user IDs
      const jobsiteIds = [...new Set(materialRequests.map(r => r.jobsite_id))];
      const userIds = [...new Set(materialRequests.map(r => r.submitted_by))];

      // Fetch jobsites data
      const { data: jobsites, error: jobsitesError } = await supabase
        .from('jobsites')
        .select('id, name, address')
        .in('id', jobsiteIds)
        .eq('company_id', user.companyId);

      if (jobsitesError) {
        console.error('Error fetching jobsites:', jobsitesError);
        throw jobsitesError;
      }

      // Fetch user profiles for submitted_by names
      const { data: userProfiles, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds)
        .eq('company_id', user.companyId);

      if (usersError) {
        console.error('Error fetching user profiles:', usersError);
        throw usersError;
      }

      // Create lookup maps
      const jobsiteMap = new Map(jobsites?.map(j => [j.id, j]) || []);
      const userMap = new Map(userProfiles?.map(u => [u.user_id, u]) || []);

      // Enrich material requests with related data
      const enrichedRequests = materialRequests.map(request => {
        const jobsite = jobsiteMap.get(request.jobsite_id);
        const userProfile = userMap.get(request.submitted_by);
        
        return {
          ...request,
          jobsites: jobsite || null,
          // Keep submitted_by as user_id for compatibility, but add user name for display
          submitted_by_name: userProfile 
            ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
            : 'Unknown User'
        };
      });

      console.log('Fetched and enriched material requests:', enrichedRequests);
      return enrichedRequests as MaterialRequest[];
    },
    enabled: !!user?.companyId,
    retry: 2,
    retryDelay: 1000,
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
        .eq('id', id)
        .eq('company_id', user?.companyId); // Ensure company isolation

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-material-requests', user?.companyId] });
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


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface CancellationRequest {
  id: string;
  company_id: string;
  requested_by: string;
  request_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useCancellationRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cancellation requests (for company admins - their own, for super admins - all)
  const { data: requests, isLoading } = useQuery({
    queryKey: ['cancellation-requests', user?.companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cancellation_requests')
        .select(`
          *,
          companies!inner(name),
          user_profiles!inner(first_name, last_name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Submit cancellation request
  const submitCancellationRequest = useMutation({
    mutationFn: async ({ notes }: { notes?: string }) => {
      if (!user?.companyId) throw new Error('No company ID found');

      const { data, error } = await supabase
        .from('cancellation_requests')
        .insert({
          company_id: user.companyId,
          requested_by: user.id,
          notes: notes || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancellation-requests'] });
      toast({
        title: "Cancellation Request Submitted",
        description: "Your plan cancellation request has been submitted for review."
      });
    },
    onError: (error) => {
      console.error('Cancellation request error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit cancellation request. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update cancellation request status (super admin only)
  const updateCancellationRequest = useMutation({
    mutationFn: async ({ 
      requestId, 
      status, 
      shouldExpireLicense 
    }: { 
      requestId: string; 
      status: 'approved' | 'rejected';
      shouldExpireLicense?: boolean;
    }) => {
      // Update the cancellation request status
      const { error: requestError } = await supabase
        .from('cancellation_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // If approving and shouldExpireLicense is true, expire the company license
      if (status === 'approved' && shouldExpireLicense) {
        const { data: request } = await supabase
          .from('cancellation_requests')
          .select('company_id')
          .eq('id', requestId)
          .single();

        if (request) {
          const { error: companyError } = await supabase
            .from('companies')
            .update({ 
              license_expires_at: new Date().toISOString()
            })
            .eq('id', request.company_id);

          if (companyError) throw companyError;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cancellation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] });
      
      const action = variables.status === 'approved' ? 'approved' : 'rejected';
      toast({
        title: `Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        description: `Cancellation request has been ${action}.`
      });
    },
    onError: (error) => {
      console.error('Update cancellation request error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update cancellation request.",
        variant: "destructive"
      });
    }
  });

  return {
    requests: requests || [],
    isLoading,
    submitCancellationRequest,
    updateCancellationRequest
  };
};

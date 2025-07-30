import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export interface MissedPunchRequest {
  id: string;
  company_id: string;
  employee_id: string;
  requested_by: string;
  request_date: string;
  punch_type: 'in' | 'out' | 'both';
  corrected_time_in?: string;
  corrected_time_out?: string;
  reason: string;
  supervisor_on_site: string;
  jobsite_id: string;
  attachment_url?: string;
  status: 'pending' | 'approved' | 'declined';
  reviewed_by?: string;
  reviewed_at?: string;
  decline_reason?: string;
  created_at: string;
  updated_at: string;
  employee_profiles?: {
    first_name: string;
    last_name: string;
    user_id: string;
  };
  jobsites?: {
    name: string;
  };
}

export const useMissedPunchRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['missed-punch-requests', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');

      console.log('Fetching missed punch requests for company:', user.companyId);

      const { data, error } = await supabase
        .from('missed_punch_requests')
        .select(`
          id,
          company_id,
          employee_id,
          requested_by,
          request_date,
          punch_type,
          corrected_time_in,
          corrected_time_out,
          reason,
          supervisor_on_site,
          jobsite_id,
          attachment_url,
          status,
          reviewed_by,
          reviewed_at,
          decline_reason,
          created_at,
          updated_at,
          employee_profiles:user_profiles!fk_missed_punch_requests_employee(
            first_name,
            last_name,
            user_id
          ),
          jobsites(name)
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching missed punch requests:', error);
        throw error;
      }
      
      console.log('Fetched missed punch requests for admin:', data);
      return data as any[];
    },
    enabled: !!user?.companyId,
  });
};

export const useMyMissedPunchRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-missed-punch-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available');
        throw new Error('No user ID');
      }

      console.log('Fetching missed punch requests for user:', user.id);

      const { data, error } = await supabase
        .from('missed_punch_requests')
        .select(`
          *,
          jobsites(name)
        `)
        .eq('requested_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching missed punch requests:', error);
        throw error;
      }
      
      console.log('Fetched missed punch requests:', data);
      return data as any[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateMissedPunchRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestData: {
      request_date: string;
      punch_type: 'in' | 'out' | 'both';
      corrected_time_in?: string;
      corrected_time_out?: string;
      reason: string;
      supervisor_on_site: string;
      jobsite_id: string;
      attachment_url?: string;
    }) => {
      if (!user?.id || !user?.companyId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('missed_punch_requests')
        .insert({
          ...requestData,
          company_id: user.companyId,
          employee_id: user.id,
          requested_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-missed-punch-requests'] });
      queryClient.invalidateQueries({ queryKey: ['missed-punch-requests'] });
      toast.success('Missed punch request submitted successfully');
    },
    onError: (error) => {
      console.error('Failed to create missed punch request:', error);
      toast.error('Failed to submit missed punch request');
    },
  });
};

export const useApproveMissedPunchRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc('approve_missed_punch_request', {
        request_id: requestId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      // Invalidate all related queries to ensure immediate refresh
      queryClient.invalidateQueries({ queryKey: ['missed-punch-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-missed-punch-requests'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['employee-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['live-punch-monitor'] });
      queryClient.invalidateQueries({ queryKey: ['live-punch-data'] });
      
      if (data && typeof data === 'object' && data.success) {
        toast.success('Request approved and timesheet updated');
      } else {
        const errorMessage = data && typeof data === 'object' && data.error ? data.error : 'Failed to approve request';
        toast.error(errorMessage);
      }
    },
    onError: (error) => {
      console.error('Failed to approve request:', error);
      toast.error('Failed to approve request');
    },
  });
};

export const useDeclineMissedPunchRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, declineReason }: { requestId: string; declineReason?: string }) => {
      const { data, error } = await supabase
        .from('missed_punch_requests')
        .update({
          status: 'declined' as any,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
          decline_reason: declineReason,
        })
        .eq('id', requestId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missed-punch-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-missed-punch-requests'] });
      toast.success('Request declined');
    },
    onError: (error) => {
      console.error('Failed to decline request:', error);
      toast.error('Failed to decline request');
    },
  });
};
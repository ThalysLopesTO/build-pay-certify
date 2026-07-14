import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { fetchProfilesByUserIds } from '@/lib/users/fetchProfiles';
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
          deleted,
          edited_by,
          edited_at,
          jobsites(name)
        `)
        .eq('company_id', user.companyId)
        .eq('deleted', false) // Filter out deleted records
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching missed punch requests:', error);
        throw error;
      }

      // Employee profiles fetched separately (employee_id FK no longer embeds)
      const profileMap = await fetchProfilesByUserIds((data || []).map((r) => r.employee_id));
      const withProfiles = (data || []).map((r) => {
        const p = profileMap[r.employee_id];
        return {
          ...r,
          employee_profiles: p
            ? { first_name: p.first_name, last_name: p.last_name, user_id: p.user_id, photo_url: p.photo_url }
            : null,
        };
      });

      console.log('Fetched missed punch requests for admin:', withProfiles);
      return withProfiles as any[];
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
        .eq('deleted', false) // Filter out deleted records
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
      console.log('Approving missed punch request:', requestId);
      
      const { data, error } = await supabase.rpc('approve_missed_punch_request', {
        request_id: requestId
      });

      if (error) {
        console.error('Database function error:', error);
        throw error;
      }
      
      console.log('Approval response:', data);
      return data;
    },
    onSuccess: (data: any) => {
      console.log('Processing approval success:', data);
      
      // Invalidate all related queries to ensure immediate refresh across all components
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['missed-punch-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['my-missed-punch-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['timesheets'] }),
        queryClient.invalidateQueries({ queryKey: ['employee-timesheets'] }),
        queryClient.invalidateQueries({ queryKey: ['live-punch-monitor'] }),
        queryClient.invalidateQueries({ queryKey: ['live-punch-data'] }),
        // Force refetch of current data
        queryClient.refetchQueries({ queryKey: ['live-punch-data'] }),
        queryClient.refetchQueries({ queryKey: ['live-punch-monitor'] })
      ]).catch(console.error);
      
      if (data && typeof data === 'object' && data.success) {
        const details = data.details;
        if (details) {
          const actionMessages = {
            'created_new_in': 'Created new timesheet entry with punch in time',
            'created_new_both': 'Created new timesheet entry with both punch times',
            'updated_existing_in': 'Updated existing timesheet with punch in time',
            'updated_existing_out': 'Updated existing timesheet with punch out time',
            'updated_existing_both': 'Updated existing timesheet with both punch times'
          };
          
          const actionMessage = actionMessages[details.action as keyof typeof actionMessages] || 'Updated timesheet';
          const employeeName = details.employee_name || 'Employee';
          const jobsiteName = details.jobsite_name || 'jobsite';
          
          toast.success(
            `✅ ${actionMessage} for ${employeeName} at ${jobsiteName}`,
            {
              duration: 5000,
              description: `Date: ${details.date}${details.check_in_time ? `\nIn: ${new Date(details.check_in_time).toLocaleTimeString()}` : ''}${details.check_out_time ? `\nOut: ${new Date(details.check_out_time).toLocaleTimeString()}` : ''}`
            }
          );
        } else {
          toast.success('✅ Request approved and timesheet updated successfully');
        }
      } else {
        const errorMessage = data && typeof data === 'object' && data.error 
          ? data.error 
          : 'Failed to approve request - unexpected response format';
        console.error('Approval failed:', errorMessage, data);
        toast.error(`❌ ${errorMessage}`);
      }
    },
    onError: (error) => {
      console.error('Failed to approve request:', error);
      toast.error('❌ Failed to approve request. Please try again or check the logs.');
    },
  });
};

export const useDeclineMissedPunchRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, declineReason }: { requestId: string; declineReason?: string }) => {
      const { data, error } = await supabase.rpc('decline_missed_punch_request', {
        request_id: requestId,
        p_decline_reason: declineReason ?? null,
      });

      if (error) throw error;

      if (data && typeof data === 'object' && (data as any).success === false) {
        throw new Error((data as any).error || 'Failed to decline request');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missed-punch-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-missed-punch-requests'] });
      toast.success('Request declined');
    },
    onError: (error: any) => {
      console.error('Failed to decline request:', error);
      toast.error(error?.message || 'Failed to decline request');
    },
  });
};

export const useEditMissedPunchRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, updateData }: { 
      requestId: string; 
      updateData: {
        request_date?: string;
        punch_type?: 'in' | 'out' | 'both';
        corrected_time_in?: string;
        corrected_time_out?: string;
        jobsite_id?: string;
        reason?: string;
      };
    }) => {
      const { data, error } = await supabase
        .from('missed_punch_requests')
        .update({
          ...updateData,
          edited_by: (await supabase.auth.getUser()).data.user?.id,
          edited_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missed-punch-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-missed-punch-requests'] });
      toast.success('Request updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update request:', error);
      toast.error('Failed to update request');
    },
  });
};

export const useDeleteMissedPunchRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from('missed_punch_requests')
        .update({
          deleted: true,
          edited_by: (await supabase.auth.getUser()).data.user?.id,
          edited_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missed-punch-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-missed-punch-requests'] });
      toast.success('Request deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete request:', error);
      toast.error('Failed to delete request');
    },
  });
};
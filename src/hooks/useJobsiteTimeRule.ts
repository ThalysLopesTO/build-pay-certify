import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface JobsiteTimeRule {
  id: string;
  jobsite_id: string;
  inherits_company_rule: boolean;
  work_start_time: string | null;
  work_end_time: string | null;
  break_minutes: number;
  break_is_paid: boolean;
  early_grace_minutes: number;
  late_grace_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface JobsiteTimeRulePayload {
  inherits_company_rule: boolean;
  work_start_time?: string | null;
  work_end_time?: string | null;
  break_minutes?: number;
  break_is_paid?: boolean;
  early_grace_minutes?: number;
  late_grace_minutes?: number;
}

export function useJobsiteTimeRule(jobsiteId: string) {
  const queryClient = useQueryClient();

  // Fetch the time rule for this jobsite
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobsite-time-rule', jobsiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobsite_time_rules')
        .select('*')
        .eq('jobsite_id', jobsiteId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching jobsite time rule:', error);
        throw error;
      }

      return data as JobsiteTimeRule | null;
    },
    enabled: !!jobsiteId,
  });

  // Upsert (insert or update) the time rule
  const upsertTimeRule = useMutation({
    mutationFn: async (payload: JobsiteTimeRulePayload) => {
      // If a rule exists, update it; otherwise insert new
      if (data?.id) {
        const { data: updated, error } = await supabase
          .from('jobsite_time_rules')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating jobsite time rule:', error);
          throw error;
        }

        return updated;
      } else {
        const { data: inserted, error } = await supabase
          .from('jobsite_time_rules')
          .insert({
            jobsite_id: jobsiteId,
            ...payload,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating jobsite time rule:', error);
          throw error;
        }

        return inserted;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobsite-time-rule', jobsiteId] });
      toast({
        title: 'Time Rules Saved',
        description: 'Jobsite time rules have been updated successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Failed to save time rule:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save time rules. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    data,
    isLoading,
    error,
    upsertTimeRule: upsertTimeRule.mutateAsync,
    isUpdating: upsertTimeRule.isPending,
  };
}

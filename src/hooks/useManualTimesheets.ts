/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import type { DayEntry } from '@/utils/manualTimesheetDays';

export interface ManualTimesheet {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name: string;
  timesheet_type: 'hourly' | 'project';
  jobsite_id: string | null;
  project_name: string;
  pay_period_start: string;
  pay_period_end: string;
  daily_hours: DayEntry[];
  total_hours: number;
  hourly_rate: number;
  extra_amount: number;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  total_payment: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ManualTimesheetInput {
  employee_id: string;
  employee_name: string;
  timesheet_type: 'hourly' | 'project';
  jobsite_id: string | null;
  project_name: string;
  pay_period_start: string;
  pay_period_end: string;
  daily_hours: DayEntry[];
  total_hours: number;
  hourly_rate: number;
  extra_amount: number;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  total_payment: number;
}

const QUERY_KEY = ['manual-timesheets'] as const;

export const useManualTimesheets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: [...QUERY_KEY, user?.companyId],
    queryFn: async (): Promise<ManualTimesheet[]> => {
      if (!user?.companyId) return [];
      const { data, error } = await supabase
        .from('manual_timesheets' as any)
        .select('*')
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ManualTimesheet[];
    },
    enabled: !!user?.companyId,
  });

  const create = useMutation({
    mutationFn: async (input: ManualTimesheetInput) => {
      if (!user?.companyId || !user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('manual_timesheets' as any)
        .insert({
          ...input,
          company_id: user.companyId,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Timesheet created');
    },
    onError: (e: any) => toast.error('Failed to create timesheet', { description: e.message }),
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ManualTimesheetInput }) => {
      const { data, error } = await supabase
        .from('manual_timesheets' as any)
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Timesheet updated');
    },
    onError: (e: any) => toast.error('Failed to update timesheet', { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('manual_timesheets' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Timesheet deleted');
    },
    onError: (e: any) => toast.error('Failed to delete timesheet', { description: e.message }),
  });

  return { list, create, update, remove };
};

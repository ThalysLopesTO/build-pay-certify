/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import type { DayEntry } from '@/utils/manualTimesheetDays';
import { fetchAllTimesheetPages } from '@/utils/manualTimesheetPayroll';

export interface ManualTimesheet {
  id: string;
  company_id: string;
  employee_id: string | null;
  employee_name: string;
  employee_role: string | null;
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
  notes: string | null;
  employee_photo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  approval_status?: 'pending' | 'approved' | 'declined';
  approval_comment?: string | null;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
}

export interface ManualTimesheetInput {
  employee_id: string | null;
  employee_name: string;
  employee_role?: string | null;
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
  notes?: string | null;
  employee_photo_url?: string | null;
}

const QUERY_KEY = ['manual-timesheets'] as const;

export const useManualTimesheets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: [...QUERY_KEY, user?.companyId],
    queryFn: async (): Promise<ManualTimesheet[]> => {
      if (!user?.companyId) return [];
      const companyId = user.companyId;
      const data = await fetchAllTimesheetPages<ManualTimesheet>((from, to) => supabase
        .from('manual_timesheets' as any)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to));

      // Exclude timesheets that already belong to a folder
      const folderItems = await fetchAllTimesheetPages<{ timesheet_id: string }>((from, to) => supabase
        .from('manual_timesheet_folder_items' as any)
        .select('timesheet_id')
        .eq('company_id', companyId)
        .order('id', { ascending: true })
        .range(from, to));
      const inFolder = new Set(((folderItems ?? []) as any[]).map((r) => r.timesheet_id));

      const rows = ((data ?? []) as unknown as ManualTimesheet[]).filter((r) => !inFolder.has(r.id));

      // Fill in employee profile photos for rows linked to an account
      const employeeIds = Array.from(new Set(rows.map((r) => r.employee_id).filter(Boolean))) as string[];
      const photoMap = new Map<string, string>();
      for (let i = 0; i < employeeIds.length; i += 200) {
        const chunk = employeeIds.slice(i, i + 200);
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, photo_url')
          .in('user_id', chunk);
        if (profilesError) {
          console.error('Error fetching employee photos:', profilesError);
          continue;
        }
        for (const p of (profiles ?? []) as { user_id: string; photo_url: string | null }[]) {
          if (p.photo_url && !photoMap.has(p.user_id)) photoMap.set(p.user_id, p.photo_url);
        }
      }
      if (photoMap.size > 0) {
        for (const r of rows) {
          if (r.employee_id && !r.employee_photo_url) {
            r.employee_photo_url = photoMap.get(r.employee_id) ?? null;
          }
        }
      }

      return rows;
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

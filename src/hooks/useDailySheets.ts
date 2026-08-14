/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export interface DailySheetCrewRow {
  id: string;
  name: string;
  role?: string | null;
  start: string;
  end: string;
  breakMinutes: number;
  notes?: string | null;
}

export interface DailySheetJobDetails {
  poBuilder?: string;
  jobName?: string;
  siteAddress?: string;
  supervisor?: string;
  weather?: string;
  safetyMeeting?: string;
  meetingTime?: string;
}

export interface DailySheet {
  id: string;
  company_id: string;
  jobsite_id: string | null;
  project_name: string;
  sheet_date: string;
  crew: DailySheetCrewRow[];
  total_hours: number;
  notes: string | null;
  job_details: DailySheetJobDetails;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailySheetInput {
  jobsite_id: string | null;
  project_name: string;
  sheet_date: string;
  crew: DailySheetCrewRow[];
  total_hours: number;
  notes?: string | null;
  job_details: DailySheetJobDetails;
}

const QUERY_KEY = ['daily-sheets'] as const;

export const useDailySheets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: [...QUERY_KEY, user?.companyId],
    queryFn: async (): Promise<DailySheet[]> => {
      if (!user?.companyId) return [];
      const { data, error } = await supabase
        .from('daily_sheets' as any)
        .select('*')
        .eq('company_id', user.companyId)
        .order('sheet_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DailySheet[];
    },
    enabled: !!user?.companyId,
  });

  const create = useMutation({
    mutationFn: async (input: DailySheetInput) => {
      if (!user?.companyId || !user?.id) throw new Error('Not authenticated');
      const fullName = [(user as any)?.firstName, (user as any)?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const { data, error } = await supabase
        .from('daily_sheets' as any)
        .insert({
          ...input,
          notes: input.notes?.trim() ? input.notes : null,
          company_id: user.companyId,
          created_by: user.id,
          created_by_name: fullName || (user as any)?.email || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (e: any) => toast.error('Failed to save daily sheet', { description: e.message }),
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: DailySheetInput }) => {
      const { data, error } = await supabase
        .from('daily_sheets' as any)
        .update({
          ...input,
          notes: input.notes?.trim() ? input.notes : null,
        } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (e: any) => toast.error('Failed to update daily sheet', { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('daily_sheets' as any)
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('You do not have permission to delete this daily sheet');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Daily sheet deleted');
    },
    onError: (e: any) => toast.error('Failed to delete daily sheet', { description: e.message }),
  });

  return { list, create, update, remove };
};

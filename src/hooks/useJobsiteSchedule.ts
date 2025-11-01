import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface ScheduleItem {
  id: string;
  jobsite_id: string;
  company_id: string;
  task_text: string;
  start_date: string;
  end_date: string;
  duration: number;
  progress: number;
  task_type: 'task' | 'milestone' | 'summary';
  parent_id: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useJobsiteSchedule = (jobsiteId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jobsite-schedule', jobsiteId],
    queryFn: async () => {
      if (!jobsiteId) {
        return [];
      }

      const { data, error } = await supabase
        .from('jobsite_schedule_items')
        .select('*')
        .eq('jobsite_id', jobsiteId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching jobsite schedule:', error);
        throw error;
      }

      return data as ScheduleItem[];
    },
    enabled: !!jobsiteId && !!user?.id,
  });
};

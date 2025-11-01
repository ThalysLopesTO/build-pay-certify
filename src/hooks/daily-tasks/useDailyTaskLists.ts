import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import type { DailyTaskList } from '@/types/daily-tasks';

interface UseDailyTaskListsOptions {
  jobsiteId?: string;
  status?: 'open' | 'closed' | 'archived';
  forDate?: string;
}

export const useDailyTaskLists = (options: UseDailyTaskListsOptions = {}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-task-lists', user?.companyId, options],
    queryFn: async () => {
      if (!user?.companyId) return [];

      let query = supabase
        .from('daily_task_lists')
        .select(`
          *,
          jobsite:jobsites (
            id,
            name,
            address
          )
        `)
        .eq('company_id', user.companyId)
        .order('for_date', { ascending: true });

      if (options.jobsiteId) {
        query = query.eq('jobsite_id', options.jobsiteId);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.forDate) {
        query = query.eq('for_date', options.forDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as DailyTaskList[];
    },
    enabled: !!user?.companyId,
  });
};

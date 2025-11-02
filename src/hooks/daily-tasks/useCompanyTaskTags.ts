import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useCompanyTaskTags = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['company-task-tags', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from('daily_task_item_tags')
        .select('tag_text, daily_task_items!inner(list_id, daily_task_lists!inner(company_id))')
        .eq('daily_task_items.daily_task_lists.company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract unique tags
      const uniqueTags = Array.from(
        new Set(data?.map((item: any) => item.tag_text) || [])
      );

      return uniqueTags as string[];
    },
    enabled: !!user?.companyId,
  });
};

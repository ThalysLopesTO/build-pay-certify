import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyTaskItem } from '@/types/daily-tasks';

export const useDailyTaskItems = (listId: string | null) => {
  return useQuery({
    queryKey: ['daily-task-items', listId],
    queryFn: async () => {
      if (!listId) return [];

      const { data, error } = await supabase
        .from('daily_task_items')
        .select(`
          *,
          daily_task_item_assignees (
            id,
            item_id,
            user_id,
            assigned_by,
            assigned_at,
            user_profiles (
              user_id,
              first_name,
              last_name,
              photo_url
            )
          ),
          daily_task_item_tags (
            id,
            item_id,
            tag_text,
            created_at
          ),
          subtasks:daily_task_items!parent_item_id (
            *,
            daily_task_item_assignees (
              id,
              item_id,
              user_id,
              assigned_by,
              assigned_at,
              user_profiles (
                user_id,
                first_name,
                last_name,
                photo_url
              )
            ),
            daily_task_item_tags (
              id,
              item_id,
              tag_text,
              created_at
            )
          )
        `)
        .eq('list_id', listId)
        .is('parent_item_id', null)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data || []) as DailyTaskItem[];
    },
    enabled: !!listId,
  });
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaskComment {
  id: string;
  list_id: string | null;
  item_id: string | null;
  author_id: string;
  body: string;
  attachments: any[];
  created_at: string;
  updated_at: string;
  author: {
    user_id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null;
}

export const useTaskComments = (listId: string) => {
  return useQuery({
    queryKey: ['task-comments', listId],
    queryFn: async (): Promise<TaskComment[]> => {
      const { data, error } = await supabase
        .from('daily_task_comments')
        .select(`
          *,
          author:user_profiles!daily_task_comments_author_id_fkey(
            user_id,
            first_name,
            last_name,
            photo_url
          )
        `)
        .eq('list_id', listId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as TaskComment[];
    },
    enabled: !!listId,
  });
};

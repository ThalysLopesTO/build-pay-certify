import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import type { DailyTaskItem } from '@/types/daily-tasks';

// Helper to build hierarchical task tree
const buildTaskTree = (items: DailyTaskItem[]): DailyTaskItem[] => {
  const itemMap = new Map<string, DailyTaskItem>();
  const rootItems: DailyTaskItem[] = [];

  // First pass: create map
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Second pass: build tree
  items.forEach(item => {
    const node = itemMap.get(item.id)!;
    if (item.parent_item_id) {
      const parent = itemMap.get(item.parent_item_id);
      if (parent) {
        parent.children!.push(node);
      } else {
        rootItems.push(node);
      }
    } else {
      rootItems.push(node);
    }
  });

  // Sort children by order_index
  const sortChildren = (items: DailyTaskItem[]) => {
    items.sort((a, b) => a.order_index - b.order_index);
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        sortChildren(item.children);
      }
    });
  };

  sortChildren(rootItems);
  return rootItems;
};

export const useDailyTaskItems = (listId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-task-items', listId],
    queryFn: async () => {
      if (!listId) return [];

      const { data, error } = await supabase
        .from('daily_task_items')
        .select(`
          *,
          daily_task_item_assignees (
            user_id,
            assigned_by,
            user_profiles!daily_task_item_assignees_user_id_fkey (
              user_id,
              first_name,
              last_name,
              photo_url
            )
          )
        `)
        .eq('list_id', listId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      return buildTaskTree(data as DailyTaskItem[]);
    },
    enabled: !!listId && !!user?.companyId,
  });
};

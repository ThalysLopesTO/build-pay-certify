import { useMemo } from 'react';
import type { DailyTaskItem, TaskProgress } from '@/types/daily-tasks';

// Helper to count leaf tasks (tasks without children)
const countLeafTasks = (items: DailyTaskItem[]): { total: number; completed: number } => {
  let total = 0;
  let completed = 0;

  const traverse = (tasks: DailyTaskItem[]) => {
    tasks.forEach(task => {
      if (!task.children || task.children.length === 0) {
        // This is a leaf task
        total++;
        if (task.is_done) completed++;
      } else {
        // This task has children, traverse them
        traverse(task.children);
      }
    });
  };

  traverse(items);
  return { total, completed };
};

export const useTaskProgress = (items: DailyTaskItem[]): TaskProgress => {
  return useMemo(() => {
    const { total, completed } = countLeafTasks(items);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  }, [items]);
};

import React from 'react';
import type { DailyTaskItem } from '@/types/daily-tasks';
import { TaskTreeItem } from './TaskTreeItem';

interface TaskTreeProps {
  items: DailyTaskItem[];
  listId: string;
  level?: number;
}

export const TaskTree = ({ items, listId, level = 0 }: TaskTreeProps) => {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id}>
          <TaskTreeItem item={item} listId={listId} level={level} />
          {item.children && item.children.length > 0 && (
            <div className="ml-6 mt-1">
              <TaskTree items={item.children} listId={listId} level={level + 1} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

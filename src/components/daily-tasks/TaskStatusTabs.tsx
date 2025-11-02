import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TaskStatusTabsProps {
  activeTab: 'all' | 'pending' | 'completed';
  onTabChange: (tab: 'all' | 'pending' | 'completed') => void;
  stats: {
    all: number;
    pending: number;
    completed: number;
  };
}

export const TaskStatusTabs: React.FC<TaskStatusTabsProps> = ({
  activeTab,
  onTabChange,
  stats,
}) => {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as any)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all">
          All ({stats.all})
        </TabsTrigger>
        <TabsTrigger value="pending">
          Pending ({stats.pending})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({stats.completed})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

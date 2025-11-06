import React from 'react';
import { UsageAssignmentCard } from './UsageAssignmentCard';
import { EquipmentUsageLog } from '@/types/equipment-usage';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PullToRefresh from 'react-simple-pull-to-refresh';

interface UsageTrackerMobileListProps {
  usageLogs: EquipmentUsageLog[];
  isLoading: boolean;
  onReturn: (log: EquipmentUsageLog) => void;
  onEdit: (log: EquipmentUsageLog) => void;
  onDelete: (log: EquipmentUsageLog) => void;
  onViewHistory: (log: EquipmentUsageLog) => void;
  canManage: boolean;
  timezone?: string;
  onRefresh?: () => Promise<void>;
  onAssignClick?: () => void;
}

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <Card key={i} className="border-l-4 border-l-muted">
        <CardContent className="p-4">
          <div className="space-y-3 animate-pulse">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
              <div className="h-6 bg-muted rounded w-16" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-muted rounded-full" />
              <div className="h-4 bg-muted rounded w-24" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 bg-muted rounded w-20" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const EmptyState: React.FC<{ canManage: boolean; onAssignClick?: () => void }> = ({ 
  canManage, 
  onAssignClick 
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="rounded-full bg-muted/50 p-6 mb-4">
      <Package className="h-12 w-12 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">No Equipment Assigned</h3>
    <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
      {canManage 
        ? "Start tracking your equipment by assigning tools to your team members."
        : "No equipment usage logs found. Contact your manager to get started."
      }
    </p>
    {canManage && onAssignClick && (
      <Button onClick={onAssignClick}>
        <Plus className="h-4 w-4 mr-2" />
        Assign Your First Tool
      </Button>
    )}
  </div>
);

export const UsageTrackerMobileList: React.FC<UsageTrackerMobileListProps> = ({
  usageLogs,
  isLoading,
  onReturn,
  onEdit,
  onDelete,
  onViewHistory,
  canManage,
  timezone,
  onRefresh,
  onAssignClick,
}) => {
  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
  };

  const content = (
    <div className="pb-24">
      {isLoading ? (
        <LoadingSkeleton />
      ) : usageLogs.length === 0 ? (
        <EmptyState canManage={canManage} onAssignClick={onAssignClick} />
      ) : (
        <div className="space-y-3">
          {usageLogs.map((log) => (
            <UsageAssignmentCard
              key={log.id}
              log={log}
              onReturn={onReturn}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewHistory={onViewHistory}
              canManage={canManage}
              timezone={timezone}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (onRefresh) {
    return (
      <PullToRefresh onRefresh={handleRefresh} pullingContent="">
        {content}
      </PullToRefresh>
    );
  }

  return content;
};

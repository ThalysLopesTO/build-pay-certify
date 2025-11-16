import React from 'react';
import { MapPin, Calendar, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Jobsite {
  id: string;
  name: string;
  address: string | null;
  starting_date?: string;
  due_date?: string;
  status?: string;
  completion_date?: string;
}

interface JobsiteMobileCardProps {
  jobsite: Jobsite;
  taskStats?: {
    completed: number;
    total: number;
    percentage: number;
  };
  onTap: () => void;
  onAction: () => void;
}

const JobsiteMobileCard: React.FC<JobsiteMobileCardProps> = ({
  jobsite,
  taskStats,
  onTap,
  onAction,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusInfo = () => {
    if (jobsite.status === 'completed') {
      return { label: 'Completed', className: 'bg-green-500/10 text-green-700 border-green-500/20' };
    }
    
    if (!jobsite.due_date) {
      return { label: 'Active', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' };
    }
    
    const dueDate = new Date(jobsite.due_date);
    const today = new Date();
    
    if (dueDate < today) {
      return { label: 'Overdue', className: 'bg-destructive/10 text-destructive border-destructive/20' };
    } else if (dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return { label: 'Due Soon', className: 'bg-orange-500/10 text-orange-700 border-orange-500/20' };
    }
    
    return { label: 'Active', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card 
      className="overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onTap}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-foreground truncate mb-1">
              {jobsite.name}
            </h3>
            <Badge 
              variant="outline" 
              className={cn("text-xs", statusInfo.className)}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Address */}
        {jobsite.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{jobsite.address}</span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Started {formatDate(jobsite.starting_date)}</span>
        </div>

        {/* Progress Bar (if tasks available) */}
        {taskStats && taskStats.total > 0 && (
          <div className="space-y-1.5 pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tasks Progress</span>
              <span className="font-medium">{taskStats.completed}/{taskStats.total}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${taskStats.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default JobsiteMobileCard;

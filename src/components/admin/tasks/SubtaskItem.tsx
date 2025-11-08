import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { StatusIcon } from './StatusIcon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Subtask } from '@/hooks/useJobsiteTasksAdvanced';
import { cn } from '@/lib/utils';
import { useTaskActions } from '@/hooks/useJobsiteTasksAdvanced';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SubtaskItemProps {
  subtask: Subtask;
  isEditable: boolean;
}

export function SubtaskItem({ subtask, isEditable }: SubtaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { updateSubtask } = useTaskActions();
  const { user } = useAuth();

  const isAssignedToUser = subtask.assignees.some(a => a.user_id === user?.id);
  const canToggleStatus = isEditable || (['admin', 'super_admin', 'foreman'].includes(user?.role || '') || isAssignedToUser);

  const handleStatusChange = async (newStatus: 'pending' | 'in_progress' | 'done' | 'blocked' | 'failed') => {
    if (!canToggleStatus) return;
    
    await updateSubtask.mutateAsync({
      subtaskId: subtask.id,
      status: newStatus,
    });
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '?';
  };

  const hasDetails = subtask.notes || subtask.assignees.length > 0 || subtask.tags.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="ml-8 border-l-2 border-dashed border-border"
    >
      <div className="pl-4 py-2">
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div className="cursor-pointer" onClick={() => canToggleStatus && setIsExpanded(!isExpanded)}>
            {canToggleStatus ? (
              <Select
                value={subtask.status}
                onValueChange={handleStatusChange}
                disabled={!canToggleStatus}
              >
                <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent">
                  <StatusIcon status={subtask.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <StatusIcon status={subtask.status} />
            )}
          </div>

          {/* Title */}
          <div className="flex-1 flex items-center gap-2">
            <span className={cn(
              'text-sm',
              subtask.status === 'done' && 'line-through text-muted-foreground'
            )}>
              {subtask.title}
            </span>

            {/* Due Time */}
            {subtask.due_time && (
              <Badge variant="outline" className="text-xs gap-1">
                <Clock className="w-3 h-3" />
                {subtask.due_time.slice(0, 5)}
              </Badge>
            )}
          </div>

          {/* Expand/Collapse if has details */}
          {hasDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 space-y-2"
          >
            {/* Notes */}
            {subtask.notes && (
              <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-2">
                {subtask.notes}
              </div>
            )}

            {/* Assignees & Tags */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Assignees */}
              {subtask.assignees.length > 0 && (
                <div className="flex items-center gap-1">
                  {subtask.assignees.map((assignee) => (
                    <Avatar key={assignee.user_id} className="h-6 w-6 border border-border">
                      <AvatarFallback className="text-xs">
                        {getInitials(assignee.user_profiles.first_name, assignee.user_profiles.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}

              {/* Tags */}
              {subtask.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {subtask.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: tag.color,
                      }}
                    >
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

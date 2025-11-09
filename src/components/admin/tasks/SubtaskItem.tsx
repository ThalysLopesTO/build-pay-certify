import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { StatusIcon } from './StatusIcon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
      className="ml-6 border-l-2 border-dashed border-border/60"
    >
      <div className="pl-3 py-1.5">
        <div className="flex items-center gap-2.5 group">
          {/* Status Icon - Clickable */}
          <div 
            className="cursor-pointer flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              if (!canToggleStatus) return;
              
              const statusCycle: Array<'pending' | 'in_progress' | 'done'> = ['pending', 'in_progress', 'done'];
              const currentIndex = statusCycle.indexOf(subtask.status as any);
              const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
              handleStatusChange(nextStatus);
            }}
          >
            <StatusIcon status={subtask.status} />
          </div>

          {/* Title & Due Time */}
          <div 
            className="flex-1 flex items-center gap-2 cursor-pointer"
            onClick={() => hasDetails && setIsExpanded(!isExpanded)}
          >
            <span className={cn(
              'text-sm',
              subtask.status === 'done' && 'line-through text-muted-foreground'
            )}>
              {subtask.title}
            </span>

            {subtask.due_time && (
              <Badge variant="outline" className="text-xs gap-1 h-4 px-1.5">
                <Clock className="w-2.5 h-2.5" />
                {subtask.due_time.slice(0, 5)}
              </Badge>
            )}
          </div>

          {/* Expand/Collapse if has details */}
          {hasDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
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
            className="mt-2 ml-6 space-y-1.5"
          >
            {/* Notes/Description */}
            {subtask.notes && (
              <p className="text-xs text-muted-foreground">
                {subtask.notes}
              </p>
            )}

            {/* Completion Info */}
            {subtask.status === 'done' && subtask.completed_by_profile && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span>Completed by</span>
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4 border border-border">
                    {subtask.completed_by_profile.photo_url && (
                      <AvatarImage 
                        src={subtask.completed_by_profile.photo_url} 
                        alt={`${subtask.completed_by_profile.first_name} ${subtask.completed_by_profile.last_name}`}
                      />
                    )}
                    <AvatarFallback className="text-[8px]">
                      {getInitials(subtask.completed_by_profile.first_name, subtask.completed_by_profile.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">
                    {subtask.completed_by_profile.first_name} {subtask.completed_by_profile.last_name}
                  </span>
                </div>
              </div>
            )}

            {/* Chips Row - Agent-Plan Style */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Assignees as chip */}
              {subtask.assignees.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Assignees:</span>
                  {subtask.assignees.map((assignee) => (
                    <Badge key={assignee.user_id} variant="outline" className="text-xs h-5 px-1.5">
                      {getInitials(assignee.user_profiles.first_name, assignee.user_profiles.last_name)}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tags as chips */}
              {subtask.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Tags:</span>
                  {subtask.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-xs h-5 px-1.5"
                      style={{
                        backgroundColor: `${tag.color}15`,
                        color: tag.color,
                        borderColor: `${tag.color}40`,
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

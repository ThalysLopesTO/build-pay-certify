
import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Play, Pause, Edit, Trash2, Timer, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobsiteTask, useJobsiteTaskActions } from '@/hooks/useJobsiteTasks';
import { format, isPast, differenceInDays, isAfter, isBefore, isToday } from 'date-fns';
import JobsiteTaskForm from './JobsiteTaskForm';

interface JobsiteTaskCardProps {
  task: JobsiteTask;
  isAdmin: boolean;
}

const JobsiteTaskCard: React.FC<JobsiteTaskCardProps> = ({ task, isAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { updateTask, deleteTask } = useJobsiteTaskActions();

  const startDate = new Date(task.start_date);
  const endDate = new Date(task.end_date);
  const currentDate = new Date();
  
  // Calculate task duration
  const duration = differenceInDays(endDate, startDate) + 1;
  
  // Calculate days remaining or overdue
  const getDaysInfo = () => {
    if (task.status === 'completed') {
      return null;
    }
    
    if (isPast(endDate) && !isToday(endDate)) {
      const overdueDays = differenceInDays(currentDate, endDate);
      return {
        type: 'overdue',
        days: overdueDays,
        text: `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`
      };
    }
    
    if (task.status === 'in_progress' && (isAfter(endDate, currentDate) || isToday(endDate))) {
      const remainingDays = differenceInDays(endDate, currentDate) + (isToday(endDate) ? 1 : 0);
      return {
        type: 'remaining',
        days: remainingDays,
        text: `${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`
      };
    }
    
    return null;
  };

  const daysInfo = getDaysInfo();
  const isOverdue = task.status !== 'completed' && isPast(endDate) && !isToday(endDate);

  // Get duration color based on length
  const getDurationColor = () => {
    if (duration <= 5) return 'text-green-600 bg-green-50';
    if (duration <= 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Get duration badge color
  const getDurationBadgeColor = () => {
    if (duration <= 5) return 'bg-green-100 text-green-800';
    if (duration <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />;
      default:
        return <Pause className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    const baseClasses = "text-xs font-medium";
    switch (task.status) {
      case 'completed':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Completed</Badge>;
      case 'in_progress':
        return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>In Progress</Badge>;
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Pending</Badge>;
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${task.task_name}"? This action cannot be undone.`)) {
      try {
        await deleteTask.mutateAsync(task.id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleQuickStatusUpdate = async (newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        taskData: { status: newStatus }
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  if (isEditing && isAdmin) {
    return (
      <JobsiteTaskForm
        jobsiteId={task.jobsite_id}
        task={task}
        onCancel={() => setIsEditing(false)}
        onSuccess={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Card className={`border ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <h4 className="font-semibold text-lg">{task.task_name}</h4>
              {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(task.created_at), 'MMM dd, yyyy')}
              </div>
            </div>

            {/* Duration Display */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3 text-gray-500" />
                <Badge className={`text-xs font-medium ${getDurationBadgeColor()}`}>
                  Duration: {duration} day{duration !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {/* Days Remaining/Overdue */}
              {daysInfo && (
                <div className="flex items-center gap-1">
                  {daysInfo.type === 'overdue' ? (
                    <Badge className="text-xs font-medium bg-red-100 text-red-800 border-red-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {daysInfo.text}
                    </Badge>
                  ) : (
                    <Badge className="text-xs font-medium bg-blue-100 text-blue-800">
                      📆 {daysInfo.text}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              {getStatusBadge()}
              {isOverdue && (
                <Badge className="text-xs font-medium bg-red-100 text-red-800">
                  Overdue
                </Badge>
              )}
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={task.status === 'pending' ? 'default' : 'outline'}
                    onClick={() => handleQuickStatusUpdate('pending')}
                    disabled={updateTask.isPending}
                  >
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === 'in_progress' ? 'default' : 'outline'}
                    onClick={() => handleQuickStatusUpdate('in_progress')}
                    disabled={updateTask.isPending}
                  >
                    In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === 'completed' ? 'default' : 'outline'}
                    onClick={() => handleQuickStatusUpdate('completed')}
                    disabled={updateTask.isPending}
                  >
                    Completed
                  </Button>
                </div>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                disabled={updateTask.isPending}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteTask.isPending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobsiteTaskCard;

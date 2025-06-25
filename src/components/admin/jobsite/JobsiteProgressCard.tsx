
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Calendar, AlertTriangle, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useJobsiteTasks } from '@/hooks/useJobsiteTasks';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { isPast, differenceInDays, isToday } from 'date-fns';
import JobsiteTaskCard from './JobsiteTaskCard';
import JobsiteTaskForm from './JobsiteTaskForm';

interface Jobsite {
  id: string;
  name: string;
  address: string;
  starting_date?: string;
  created_at: string;
}

interface JobsiteProgressCardProps {
  jobsite: Jobsite;
}

const JobsiteProgressCard: React.FC<JobsiteProgressCardProps> = ({ jobsite }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useJobsiteTasks(jobsite.id);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Calculate enhanced progress metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  
  // Calculate overdue tasks (not completed and past end date)
  const overdueTasks = tasks.filter(task => 
    task.status !== 'completed' && isPast(new Date(task.end_date)) && !isToday(new Date(task.end_date))
  ).length;
  
  // Calculate duration statistics
  const taskDurations = tasks.map(task => {
    const startDate = new Date(task.start_date);
    const endDate = new Date(task.end_date);
    return differenceInDays(endDate, startDate) + 1;
  });
  
  const shortTasks = taskDurations.filter(duration => duration <= 5).length;
  const mediumTasks = taskDurations.filter(duration => duration >= 6 && duration <= 10).length;
  const longTasks = taskDurations.filter(duration => duration >= 11).length;
  
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const formatStartingDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className="border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {jobsite.name}
              {overdueTasks > 0 && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
            <p className="text-gray-600 text-sm">{jobsite.address}</p>
            {jobsite.starting_date && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                Starting: {formatStartingDate(jobsite.starting_date)}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {totalTasks > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{progressPercentage}% Complete</span>
                  {overdueTasks > 0 && (
                    <Badge className="text-xs bg-red-100 text-red-800">
                      {overdueTasks} Overdue
                    </Badge>
                  )}
                </div>
                <Progress value={progressPercentage} className="w-32 h-2" />
                <div className="text-xs text-gray-500 mt-1">
                  {completedTasks}/{totalTasks} tasks completed
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Enhanced Task Summary */}
            {totalTasks > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-600">{totalTasks}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{inProgressTasks}</div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{completedTasks}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                {overdueTasks > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{overdueTasks}</div>
                    <div className="text-xs text-gray-500">Overdue</div>
                  </div>
                )}
              </div>
            )}

            {/* Duration Summary */}
            {totalTasks > 0 && (
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Task Duration Summary:</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {shortTasks > 0 && (
                    <Badge className="bg-green-100 text-green-800">
                      {shortTasks} Short (1-5d)
                    </Badge>
                  )}
                  {mediumTasks > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {mediumTasks} Medium (6-10d)
                    </Badge>
                  )}
                  {longTasks > 0 && (
                    <Badge className="bg-red-100 text-red-800">
                      {longTasks} Long (11+d)
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Add Task Button for Admins */}
            {isAdmin && (
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Tasks & Phases</h4>
                <Button
                  size="sm"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>
            )}

            {/* Add Task Form */}
            {showAddForm && isAdmin && (
              <JobsiteTaskForm
                jobsiteId={jobsite.id}
                onCancel={() => setShowAddForm(false)}
                onSuccess={() => setShowAddForm(false)}
              />
            )}

            {/* Task List */}
            {isLoading ? (
              <div className="text-center py-4 text-gray-500">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isAdmin ? 'No tasks yet. Add your first task to get started.' : 'No tasks available for this jobsite.'}
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <JobsiteTaskCard 
                    key={task.id} 
                    task={task} 
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default JobsiteProgressCard;

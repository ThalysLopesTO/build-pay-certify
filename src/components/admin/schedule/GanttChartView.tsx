import React, { useEffect, useRef, useState } from 'react';
import { Gantt } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/dist/gantt.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { useJobsiteSchedule } from '@/hooks/useJobsiteSchedule';
import { useUpdateScheduleTask, useDeleteScheduleTask } from '@/hooks/useScheduleMutations';
import ScheduleTaskDialog from './ScheduleTaskDialog';

interface GanttChartViewProps {
  jobsite: {
    id: string;
    name: string;
    address?: string;
  };
  onBack: () => void;
}

const GanttChartView: React.FC<GanttChartViewProps> = ({ jobsite, onBack }) => {
  const { data: scheduleItems = [], isLoading } = useJobsiteSchedule(jobsite.id);
  const updateTask = useUpdateScheduleTask(jobsite.id);
  const deleteTask = useDeleteScheduleTask(jobsite.id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Transform data for Gantt chart
  const ganttTasks = scheduleItems.map(item => ({
    id: item.id,
    text: item.task_text,
    start: new Date(item.start_date),
    end: new Date(item.end_date),
    duration: item.duration,
    progress: item.progress / 100,
    type: item.task_type,
    parent: item.parent_id || 0,
  }));

  const handleTaskUpdate = (id: string, task: any) => {
    updateTask.mutate({
      id,
      task_text: task.text,
      start_date: task.start.toISOString().split('T')[0],
      end_date: task.end.toISOString().split('T')[0],
      progress: Math.round(task.progress * 100),
      task_type: task.type,
    });
  };

  const handleTaskDelete = (id: string) => {
    deleteTask.mutate(id);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{jobsite.name}</h1>
            {jobsite.address && (
              <p className="text-sm text-muted-foreground">{jobsite.address}</p>
            )}
          </div>
        </div>
        <Button onClick={handleAddTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-background" style={{ height: 'calc(100vh - 250px)' }}>
        {ganttTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-muted-foreground">No tasks scheduled yet</p>
            <Button onClick={handleAddTask}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Task
            </Button>
          </div>
        ) : (
          <Gantt
            tasks={ganttTasks}
            scales={[
              { unit: 'month', step: 1, format: 'MMMM yyyy' },
              { unit: 'day', step: 1, format: 'd' }
            ]}
            columns={[
              { name: 'text', label: 'Task', width: 250 },
              { name: 'start', label: 'Start Date', width: 100 },
              { name: 'end', label: 'End Date', width: 100 },
            ]}
            onTaskUpdate={({ id, task }) => handleTaskUpdate(id, task)}
            onTaskDelete={({ id }) => handleTaskDelete(id)}
          />
        )}
      </div>

      <ScheduleTaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        jobsiteId={jobsite.id}
        task={editingTask}
      />
    </div>
  );
};

export default GanttChartView;

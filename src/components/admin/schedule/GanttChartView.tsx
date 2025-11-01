import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Gantt, Willow } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';
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

  // Create ID mapping: UUID -> numeric ID (SVAR requires numeric IDs)
  const idMap = useMemo(() => {
    const map = new Map<string, number>();
    scheduleItems.forEach((item, index) => {
      map.set(item.id, index + 1);
    });
    return map;
  }, [scheduleItems]);

  // Create reverse mapping: numeric ID -> UUID (for database operations)
  const reverseIdMap = useMemo(() => {
    const map = new Map<number, string>();
    scheduleItems.forEach((item, index) => {
      map.set(index + 1, item.id);
    });
    return map;
  }, [scheduleItems]);

  // Transform data for Gantt chart with numeric IDs
  const ganttTasks = useMemo(() => {
    return scheduleItems.map(item => ({
      id: idMap.get(item.id)!,
      text: item.task_text,
      start: new Date(item.start_date),
      end: new Date(item.end_date),
      duration: item.duration,
      progress: item.progress / 100,
      type: item.task_type,
      parent: item.parent_id ? (idMap.get(item.parent_id) || 0) : 0,
    }));
  }, [scheduleItems, idMap]);

  // Empty links array for task dependencies (can be populated later)
  const links: any[] = [];

  // Debug logging
  useEffect(() => {
    console.log('📊 Gantt Tasks:', ganttTasks);
    console.log('🗺️ ID Mapping:', Object.fromEntries(idMap));
  }, [ganttTasks, idMap]);

  const handleTaskUpdate = (data: { id: number; task: any }) => {
    const uuid = reverseIdMap.get(data.id);
    if (!uuid) {
      console.error('Could not find UUID for task ID:', data.id);
      return;
    }
    
    updateTask.mutate({
      id: uuid,
      task_text: data.task.text,
      start_date: data.task.start.toISOString().split('T')[0],
      end_date: data.task.end.toISOString().split('T')[0],
      progress: Math.round(data.task.progress * 100),
      task_type: data.task.type,
    });
  };

  const handleTaskDelete = (data: { id: number }) => {
    const uuid = reverseIdMap.get(data.id);
    if (uuid) {
      deleteTask.mutate(uuid);
    } else {
      console.error('Could not find UUID for task ID:', data.id);
    }
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
          <Willow>
            <Gantt
              tasks={ganttTasks}
              links={links}
              scales={[
                { unit: 'month', step: 1, format: 'MMMM yyyy' },
                { unit: 'day', step: 1, format: 'd' }
              ]}
              columns={[
                { name: 'text', label: 'Task', width: 250 },
                { name: 'start', label: 'Start Date', width: 100 },
                { name: 'end', label: 'End Date', width: 100 },
              ]}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
            />
          </Willow>
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

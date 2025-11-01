import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Gantt, Willow, Toolbar } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { useJobsiteSchedule } from '@/hooks/useJobsiteSchedule';
import { useCreateScheduleTask, useUpdateScheduleTask, useDeleteScheduleTask } from '@/hooks/useScheduleMutations';
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
  const createTask = useCreateScheduleTask(jobsite.id);
  const updateTask = useUpdateScheduleTask(jobsite.id);
  const deleteTask = useDeleteScheduleTask(jobsite.id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // SVAR API references
  const apiRef = useRef<any>(null);
  const [api, setApi] = useState<any>(null);
  const [selected, setSelected] = useState<number[]>([]);

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
    return scheduleItems
      .map(item => {
        const startDate = new Date(item.start_date);
        const endDate = new Date(item.end_date);
        
        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error('Invalid date for task:', item);
          return null;
        }
        
        return {
          id: idMap.get(item.id)!,
          text: item.task_text || 'Untitled Task',
          start: startDate,
          end: endDate,
          duration: item.duration,
          progress: item.progress / 100,
          type: item.task_type || 'task',
          parent: item.parent_id ? (idMap.get(item.parent_id) || 0) : 0,
          open: true,
        };
      })
      .filter((task): task is NonNullable<typeof task> => task !== null);
  }, [scheduleItems, idMap]);

  // Empty links array for task dependencies (can be populated later)
  const links: any[] = [];


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

  // Initialize SVAR API
  const initApi = (ganttApi: any) => {
    setApi(ganttApi);
    apiRef.current = ganttApi;
    
    // Subscribe to task selection changes
    ganttApi.on("select-task", () => {
      const state = ganttApi.getReactiveState();
      setSelected(state.selected || []);
    });
    
    ganttApi.on("unselect-task", () => {
      const state = ganttApi.getReactiveState();
      setSelected(state.selected || []);
    });
  };

  // API-based action handlers
  const handleAddTaskAPI = () => {
    if (!api) return;
    
    const newTask = {
      text: "New task",
      start: new Date(),
      duration: 1,
      progress: 0,
      type: "task",
    };
    
    const targetId = selected.length > 0 ? selected[0] : null;
    
    api.exec("add-task", {
      task: newTask,
      target: targetId,
      mode: targetId ? "after" : "child",
    });
  };

  const handleEditTaskAPI = () => {
    if (!api || selected.length === 0) return;
    api.exec("show-editor", { id: selected[0] });
  };

  const handleDeleteTaskAPI = () => {
    if (!api || selected.length === 0) return;
    
    const order = getActionOrder(true);
    
    order.forEach((id) => {
      api.exec("delete-task", { id });
      
      const uuid = reverseIdMap.get(id);
      if (uuid) {
        deleteTask.mutate(uuid);
      }
    });
  };

  const handleIndentTask = (mode: "indent" | "outdent") => {
    if (!api || selected.length === 0) return;
    
    selected.forEach((id) => {
      api.exec(mode === "indent" ? "indent-task" : "outdent-task", { id });
    });
  };

  const getActionOrder = (changeDir: boolean) => {
    const tasks = selected
      .map((id) => api.getTask(id))
      .filter(Boolean)
      .sort((a, b) => {
        return a.$level - b.$level || a.$y - b.$y;
      });
    
    const idOrder = tasks.map((o) => o.id);
    return changeDir ? idOrder.reverse() : idOrder;
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  // Sync SVAR changes to database
  useEffect(() => {
    if (!api) return;
    
    const unsubscribeAdd = api.intercept("add-task", (data: any) => {
      const newTask = {
        jobsite_id: jobsite.id,
        task_text: data.task.text,
        start_date: data.task.start.toISOString().split('T')[0],
        end_date: new Date(data.task.start.getTime() + data.task.duration * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        duration: data.task.duration,
        progress: Math.round(data.task.progress * 100),
        task_type: data.task.type,
        parent_id: null,
        sort_order: 0,
      };
      
      createTask.mutateAsync(newTask);
      return data;
    });
    
    const unsubscribeUpdate = api.intercept("update-task", (data: any) => {
      const uuid = reverseIdMap.get(data.id);
      if (uuid) {
        updateTask.mutate({
          id: uuid,
          task_text: data.task.text,
          start_date: data.task.start.toISOString().split('T')[0],
          end_date: data.task.end.toISOString().split('T')[0],
          progress: Math.round(data.task.progress * 100),
          task_type: data.task.type,
        });
      }
      return data;
    });
    
    return () => {
      if (unsubscribeAdd) unsubscribeAdd();
      if (unsubscribeUpdate) unsubscribeUpdate();
    };
  }, [api, jobsite.id, reverseIdMap, createTask, updateTask]);

  // Define toolbar items
  const toolbarItems = useMemo(() => {
    const baseItems = [
      {
        id: "add-task",
        comp: "button",
        icon: "wxi-plus",
        text: "New task",
        type: "primary",
        handler: handleAddTaskAPI,
      },
    ];
    
    const selectedItems = selected.length > 0 ? [
      {
        id: "edit-task",
        comp: "button",
        icon: "wxi-edit",
        text: "Edit",
        handler: handleEditTaskAPI,
      },
      {
        id: "delete-task",
        comp: "button",
        icon: "wxi-delete",
        text: "Delete",
        handler: handleDeleteTaskAPI,
      },
      {
        type: "spacer"
      },
      {
        id: "indent-task",
        comp: "button",
        icon: "wxi-angle-right",
        text: "Indent",
        handler: () => handleIndentTask("indent"),
      },
      {
        id: "outdent-task",
        comp: "button",
        icon: "wxi-angle-left",
        text: "Outdent",
        handler: () => handleIndentTask("outdent"),
      },
    ] : [];
    
    return [...baseItems, ...selectedItems];
  }, [selected, api]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Gantt Debug:', {
      scheduleItemsCount: scheduleItems.length,
      ganttTasksCount: ganttTasks.length,
      jobsiteId: jobsite.id,
      hasApi: !!api,
      tasks: ganttTasks,
    });
  }, [scheduleItems, ganttTasks, jobsite.id, api]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-3 border-b bg-background shrink-0">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Error Loading Schedule</h1>
        </div>
        <div className="flex items-center justify-center flex-1">
          <div className="text-center max-w-md">
            <p className="text-red-500 font-semibold mb-2">Error loading Gantt chart</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={onBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Compact header */}
      <div className="flex items-center gap-3 p-3 border-b bg-background shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{jobsite.name}</h1>
          {jobsite.address && (
            <p className="text-xs text-muted-foreground">{jobsite.address}</p>
          )}
        </div>
      </div>

      {/* SVAR Toolbar */}
      {api && (
        <div className="border-b bg-background shrink-0">
          <Toolbar items={toolbarItems} api={api} />
        </div>
      )}

      {/* Full-width Gantt chart */}
      <div className="flex-1 min-h-0">
        <div style={{ height: '100%', width: '100%' }}>
          <Willow>
            <Gantt
              init={initApi}
              tasks={ganttTasks}
              links={links}
              cellWidth={40}
              cellHeight={40}
              zoom={true}
              scales={[
                { unit: 'month', step: 1, format: 'MMMM yyyy' },
                { unit: 'day', step: 1, format: 'd' }
              ]}
              columns={[
                { 
                  name: 'text', 
                  label: 'Task name', 
                  width: 250,
                  tree: true,
                  resize: true
                },
                { 
                  name: 'start', 
                  label: 'Start date', 
                  width: 120,
                  align: 'center',
                  resize: true
                },
                { 
                  name: 'duration', 
                  label: 'Duration', 
                  width: 80,
                  align: 'center',
                  resize: true
                },
              ]}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
            />
          </Willow>
        </div>
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

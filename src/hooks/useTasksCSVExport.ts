import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const useTasksCSVExport = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const exportTasksToCSV = async ({
    jobsiteId,
    startDate,
    endDate,
    jobsiteName,
  }: {
    jobsiteId: string;
    startDate: string;
    endDate: string;
    jobsiteName: string;
  }) => {
    try {
      if (!user?.companyId) {
        throw new Error('User information is required');
      }

      // 1. Query tasks in date range with all relations
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignees:task_assignees(
            user_profiles(first_name, last_name, user_id)
          ),
          tags:task_tag_links(
            task_tags(label)
          ),
          subtasks(
            id,
            title,
            status,
            due_time,
            notes,
            assignees:subtask_assignees(
              user_profiles(first_name, last_name, user_id)
            ),
            tags:subtask_tag_links(
              task_tags(label)
            )
          ),
          created_by_profile:user_profiles!tasks_created_by_fkey(first_name, last_name, user_id)
        `)
        .eq('company_id', user.companyId)
        .eq('jobsite_id', jobsiteId)
        .gte('task_date', startDate)
        .lte('task_date', endDate)
        .order('task_date', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      if (!tasks || tasks.length === 0) {
        toast({
          title: 'No Tasks Found',
          description: 'No tasks found in the selected date range.',
          variant: 'destructive',
        });
        return;
      }

      // 2. Flatten task + subtask rows
      const rows: string[][] = [];
      
      // Header row
      rows.push([
        'Type',
        'Task ID',
        'Subtask ID',
        'Task Date',
        'Title',
        'Parent Task Title',
        'Status',
        'Priority',
        'Trade',
        'Due Time',
        'Assignees',
        'Tags',
        'Created By',
        'Created At',
        'Completed At',
        'Notes',
      ]);

      // Data rows
      for (const task of tasks as any[]) {
        const taskAssignees = task.assignees
          ?.map((a: any) => `${a.user_profiles?.first_name || ''} ${a.user_profiles?.last_name || ''}`.trim())
          .filter(Boolean)
          .join('; ') || '';

        const taskTags = task.tags
          ?.map((t: any) => t.task_tags?.label)
          .filter(Boolean)
          .join('; ') || '';

        const createdBy = task.created_by_profile 
          ? `${task.created_by_profile.first_name || ''} ${task.created_by_profile.last_name || ''}`.trim()
          : '';

        const completedAt = task.status === 'done' ? task.updated_at : '';

        // Add task row
        rows.push([
          'task',
          task.id,
          '',
          task.task_date,
          task.title || '',
          '',
          task.status,
          task.priority,
          task.trade || '',
          task.due_time || '',
          taskAssignees,
          taskTags,
          createdBy,
          task.created_at,
          completedAt,
          task.description || '',
        ]);

        // Add subtask rows
        if (task.subtasks && task.subtasks.length > 0) {
          for (const subtask of task.subtasks) {
            const subtaskAssignees = subtask.assignees
              ?.map((a: any) => `${a.user_profiles?.first_name || ''} ${a.user_profiles?.last_name || ''}`.trim())
              .filter(Boolean)
              .join('; ') || '';

            const subtaskTags = subtask.tags
              ?.map((t: any) => t.task_tags?.label)
              .filter(Boolean)
              .join('; ') || '';

            const subtaskCompletedAt = subtask.status === 'done' ? subtask.updated_at : '';

            rows.push([
              'subtask',
              task.id,
              subtask.id,
              task.task_date,
              subtask.title || '',
              task.title || '',
              subtask.status,
              '', // subtasks don't have priority
              '', // subtasks don't have trade
              subtask.due_time || '',
              subtaskAssignees,
              subtaskTags,
              '', // subtasks don't have created_by
              subtask.created_at,
              subtaskCompletedAt,
              subtask.notes || '',
            ]);
          }
        }
      }

      // 3. Build CSV with BOM for Excel
      const csvContent = rows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ).join('\n');

      // Add UTF-8 BOM for Excel compatibility
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

      // 4. Trigger browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${jobsiteName.replace(/[^a-z0-9]/gi, '_')}_tasks_${startDate}_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Exported ${tasks.length} tasks to CSV.`,
      });
    } catch (error: any) {
      console.error('Error exporting tasks to CSV:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export tasks to CSV.',
        variant: 'destructive',
      });
    }
  };

  return { exportTasksToCSV };
};

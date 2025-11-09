import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { QuickTaskInput } from './QuickTaskInput';
import { TaskDetailsAccordion } from './TaskDetailsAccordion';
import { TaskReviewSummary } from './TaskReviewSummary';
import { DraftTask } from './types';
import { useTaskActions } from '@/hooks/useJobsiteTasksAdvanced';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

type Step = 'input' | 'details' | 'review';

interface QuickTaskComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobsiteId: string;
  jobsiteName: string;
  defaultDate: string;
}

export function QuickTaskComposer({
  open,
  onOpenChange,
  jobsiteId,
  jobsiteName,
  defaultDate,
}: QuickTaskComposerProps) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<Step>('input');
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>([
    {
      id: uuidv4(),
      title: '',
      date: defaultDate,
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const { createTask } = useTaskActions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleClose = () => {
    setStep('input');
    setDraftTasks([
      {
        id: uuidv4(),
        title: '',
        date: defaultDate,
      },
    ]);
    onOpenChange(false);
  };

  const handleQuickCreate = async () => {
    const validTasks = draftTasks.filter(t => t.title.trim().length > 0);
    if (validTasks.length === 0) return;

    setIsCreating(true);

    try {
      for (const task of validTasks) {
        await createTask.mutateAsync({
          jobsiteId,
          taskData: {
            title: task.title,
            task_date: task.date,
            status: 'pending',
            priority: 'medium',
            assigneeIds: [],
            tagIds: [],
          },
        });
      }

      toast({
        title: 'Success',
        description: `Created ${validTasks.length} task${validTasks.length > 1 ? 's' : ''}`,
      });

      queryClient.invalidateQueries({ queryKey: ['jobsite-tasks'] });
      handleClose();
    } catch (error: any) {
      toast({
        title: 'Error creating tasks',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateAll = async () => {
    const validTasks = draftTasks.filter(t => t.title.trim().length > 0);
    if (validTasks.length === 0) return;

    setIsCreating(true);

    try {
      for (const task of validTasks) {
        // Create parent task
        const taskResult = await createTask.mutateAsync({
          jobsiteId,
          taskData: {
            title: task.title,
            description: task.description,
            task_date: task.date,
            due_time: task.dueTime,
            status: 'pending',
            priority: task.priority || 'medium',
            trade: task.trade,
            assigneeIds: task.assigneeIds || [],
            tagIds: task.tagIds || [],
          },
        });

        // Create subtasks if any
        if (task.subtasks && task.subtasks.length > 0) {
          for (let i = 0; i < task.subtasks.length; i++) {
            const subtask = task.subtasks[i];
            if (!subtask.title.trim()) continue;

            const { data: createdSubtask, error: subtaskError } = await supabase
              .from('subtasks')
              .insert({
                task_id: taskResult.id,
                title: subtask.title,
                notes: subtask.notes || null,
                status: 'pending',
                sort_order: i,
              })
              .select()
              .single();

            if (subtaskError) {
              console.error('Error creating subtask:', subtaskError);
              continue;
            }

            // Add subtask assignees if any
            if (subtask.assigneeIds && subtask.assigneeIds.length > 0 && createdSubtask) {
              const assignees = subtask.assigneeIds.map(userId => ({
                subtask_id: createdSubtask.id,
                user_id: userId,
              }));

              await supabase.from('subtask_assignees').insert(assignees);
            }

            // Add subtask tags if any
            if (subtask.tagIds && subtask.tagIds.length > 0 && createdSubtask) {
              const tagLinks = subtask.tagIds.map(tagId => ({
                subtask_id: createdSubtask.id,
                tag_id: tagId,
              }));

              await supabase.from('subtask_tag_links').insert(tagLinks);
            }
          }
        }
      }

      const totalSubtasks = validTasks.reduce((acc, t) => acc + (t.subtasks?.length || 0), 0);
      
      toast({
        title: 'Success',
        description: `Created ${validTasks.length} task${validTasks.length > 1 ? 's' : ''}${
          totalSubtasks > 0 ? ` with ${totalSubtasks} subtask${totalSubtasks > 1 ? 's' : ''}` : ''
        }`,
      });

      queryClient.invalidateQueries({ queryKey: ['jobsite-tasks'] });
      handleClose();
    } catch (error: any) {
      toast({
        title: 'Error creating tasks',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const content = (
    <div className="h-full">
      {step === 'input' && (
        <QuickTaskInput
          jobsiteName={jobsiteName}
          defaultDate={defaultDate}
          draftTasks={draftTasks}
          onDraftTasksChange={setDraftTasks}
          onNext={() => setStep('details')}
          onQuickCreate={handleQuickCreate}
          onCancel={handleClose}
        />
      )}

      {step === 'details' && (
        <TaskDetailsAccordion
          draftTasks={draftTasks}
          onDraftTasksChange={setDraftTasks}
          onBack={() => setStep('input')}
          onReview={() => setStep('review')}
        />
      )}

      {step === 'review' && (
        <TaskReviewSummary
          jobsiteName={jobsiteName}
          draftTasks={draftTasks}
          isCreating={isCreating}
          onBack={() => setStep('details')}
          onCreate={handleCreateAll}
          onCancel={handleClose}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {content}
      </DialogContent>
    </Dialog>
  );
}

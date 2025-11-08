import { useState } from 'react';
import { DraftTask } from './types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SubtaskComposer } from './SubtaskComposer';
import { useEmployees } from '@/hooks/new/useUsers';
import { useTaskTags } from '@/hooks/useJobsiteTasksAdvanced';
import { Calendar, Clock, User, Tag, FileText, AlertCircle, ListTodo, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { parseLocalDate } from '@/utils/dateUtils';

interface TaskDetailsAccordionProps {
  draftTasks: DraftTask[];
  onDraftTasksChange: (tasks: DraftTask[]) => void;
  onBack: () => void;
  onReview: () => void;
}

export function TaskDetailsAccordion({
  draftTasks,
  onDraftTasksChange,
  onBack,
  onReview,
}: TaskDetailsAccordionProps) {
  const { data: employeesData } = useEmployees();
  const { data: tags = [] } = useTaskTags();
  const [editingSubtasksForTask, setEditingSubtasksForTask] = useState<string | null>(null);

  const employees = employeesData?.activeEmployees || [];

  const updateTask = (id: string, updates: Partial<DraftTask>) => {
    onDraftTasksChange(
      draftTasks.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const toggleAssignee = (taskId: string, userId: string) => {
    const task = draftTasks.find(t => t.id === taskId);
    if (!task) return;

    const currentAssignees = task.assigneeIds || [];
    const newAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter(id => id !== userId)
      : [...currentAssignees, userId];

    updateTask(taskId, { assigneeIds: newAssignees });
  };

  const toggleTag = (taskId: string, tagId: string) => {
    const task = draftTasks.find(t => t.id === taskId);
    if (!task) return;

    const currentTags = task.tagIds || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];

    updateTask(taskId, { tagIds: newTags });
  };

  const getTaskSummary = (task: DraftTask) => {
    const parts: string[] = [];
    
    if (task.assigneeIds && task.assigneeIds.length > 0) {
      parts.push(`${task.assigneeIds.length} assignee${task.assigneeIds.length > 1 ? 's' : ''}`);
    } else {
      parts.push('No assignees');
    }

    if (task.priority) {
      parts.push(task.priority);
    }

    if (task.subtasks && task.subtasks.length > 0) {
      parts.push(`${task.subtasks.length} subtask${task.subtasks.length > 1 ? 's' : ''}`);
    }

    return parts.join(' • ');
  };

  const currentEditingTask = draftTasks.find(t => t.id === editingSubtasksForTask);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-4">
        <h2 className="text-lg font-semibold">Task Details</h2>
        <p className="text-sm text-muted-foreground">Add optional details to your tasks</p>
      </div>

      {/* Scrollable Task Details */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
        {draftTasks.map((task) => (
          <Accordion key={task.id} type="single" collapsible className="border rounded-lg">
            <AccordionItem value="item-1" className="border-none">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">{task.title || 'Untitled Task'}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {format(parseLocalDate(task.date), 'MMM d, yyyy')} • {getTaskSummary(task)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                {/* Task Date */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    Task Date
                  </Label>
                  <div className="text-sm font-medium">{format(parseLocalDate(task.date), 'EEEE, MMMM d, yyyy')}</div>
                </div>

                {/* Description */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="description" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                        <FileText className="w-3.5 h-3.5" />
                        Description (optional)
                      </Label>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Textarea
                        value={task.description || ''}
                        onChange={(e) => updateTask(task.id, { description: e.target.value })}
                        placeholder="Add more details about this task..."
                        className="min-h-[80px]"
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Priority */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="priority" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Priority (optional)
                      </Label>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Select
                        value={task.priority || 'medium'}
                        onValueChange={(value: 'low' | 'medium' | 'high') =>
                          updateTask(task.id, { priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Trade */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="trade" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                        <Briefcase className="w-3.5 h-3.5" />
                        Trade (optional)
                      </Label>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Input
                        value={task.trade || ''}
                        onChange={(e) => updateTask(task.id, { trade: e.target.value })}
                        placeholder="e.g., Electrical, Plumbing, HVAC"
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Assignees */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="assignees" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                        <User className="w-3.5 h-3.5" />
                        Assign To ({task.assigneeIds?.length || 0})
                      </Label>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2">
                        {employees.map((emp) => {
                          const isSelected = task.assigneeIds?.includes(emp.user_id);
                          return (
                            <Badge
                              key={emp.user_id}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => toggleAssignee(task.id, emp.user_id)}
                            >
                              {emp.first_name} {emp.last_name}
                            </Badge>
                          );
                        })}
                        {employees.length === 0 && (
                          <p className="text-sm text-muted-foreground">No employees available</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Due Time */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="due-time" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                        <Clock className="w-3.5 h-3.5" />
                        Due Time (optional)
                      </Label>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Input
                        type="time"
                        value={task.dueTime || ''}
                        onChange={(e) => updateTask(task.id, { dueTime: e.target.value })}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Tags */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="tags" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                        <Tag className="w-3.5 h-3.5" />
                        Tags ({task.tagIds?.length || 0})
                      </Label>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => {
                          const isSelected = task.tagIds?.includes(tag.id);
                          return (
                            <Badge
                              key={tag.id}
                              variant={isSelected ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => toggleTag(task.id, tag.id)}
                            >
                              {tag.label}
                            </Badge>
                          );
                        })}
                        {tags.length === 0 && (
                          <p className="text-sm text-muted-foreground">No tags available</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Subtasks */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSubtasksForTask(task.id)}
                    className="w-full justify-start"
                  >
                    <ListTodo className="w-4 h-4 mr-2" />
                    Subtasks {task.subtasks && task.subtasks.length > 0 ? `(${task.subtasks.length})` : ''}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex-shrink-0 border-t border-border p-4 flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onReview} className="flex-1">
          Review & Create
        </Button>
      </div>

      {/* Subtask Edit Dialog */}
      <Dialog open={!!editingSubtasksForTask} onOpenChange={() => setEditingSubtasksForTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Subtasks for "{currentEditingTask?.title || 'Task'}"
            </DialogTitle>
          </DialogHeader>
          {currentEditingTask && (
            <SubtaskComposer
              subtasks={currentEditingTask.subtasks || []}
              onSubtasksChange={(subtasks) => {
                updateTask(currentEditingTask.id, { subtasks });
              }}
              onDone={() => setEditingSubtasksForTask(null)}
              onCancel={() => setEditingSubtasksForTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { DraftTask } from './types';
import { format, addDays, startOfToday } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { parseLocalDate } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickTaskInputProps {
  jobsiteName: string;
  defaultDate: string;
  draftTasks: DraftTask[];
  onDraftTasksChange: (tasks: DraftTask[]) => void;
  onNext: () => void;
  onQuickCreate: () => void;
  onCancel: () => void;
}

export function QuickTaskInput({
  jobsiteName,
  defaultDate,
  draftTasks,
  onDraftTasksChange,
  onNext,
  onQuickCreate,
  onCancel,
}: QuickTaskInputProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(parseLocalDate(defaultDate));

  const handleAddTask = () => {
    const newTask: DraftTask = {
      id: uuidv4(),
      title: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
    };
    onDraftTasksChange([...draftTasks, newTask]);
  };

  const handleRemoveTask = (id: string) => {
    onDraftTasksChange(draftTasks.filter(t => t.id !== id));
  };

  const handleUpdateTaskTitle = (id: string, title: string) => {
    onDraftTasksChange(
      draftTasks.map(t => (t.id === id ? { ...t, title, date: format(selectedDate, 'yyyy-MM-dd') } : t))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, id: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const currentIndex = draftTasks.findIndex(t => t.id === id);
      if (currentIndex === draftTasks.length - 1) {
        handleAddTask();
      }
    }
  };

  const hasValidTasks = draftTasks.some(t => t.title.trim().length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{jobsiteName}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">New Task</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant={format(selectedDate, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd') ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedDate(startOfToday());
              onDraftTasksChange(draftTasks.map(t => ({ ...t, date: format(startOfToday(), 'yyyy-MM-dd') })));
            }}
          >
            Today
          </Button>
          <Button
            variant={format(selectedDate, 'yyyy-MM-dd') === format(addDays(startOfToday(), 1), 'yyyy-MM-dd') ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              const tomorrow = addDays(startOfToday(), 1);
              setSelectedDate(tomorrow);
              onDraftTasksChange(draftTasks.map(t => ({ ...t, date: format(tomorrow, 'yyyy-MM-dd') })));
            }}
          >
            Tomorrow
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(selectedDate, 'MMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    onDraftTasksChange(draftTasks.map(t => ({ ...t, date: format(date, 'yyyy-MM-dd') })));
                  }
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Scrollable Task Input Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <label className="text-sm font-medium text-muted-foreground">
          What needs to be done?
        </label>

        <AnimatePresence mode="popLayout">
          {draftTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex items-start gap-2 group"
            >
              <div className="flex-1 relative">
                <textarea
                  value={task.title}
                  onChange={(e) => handleUpdateTaskTitle(task.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, task.id)}
                  placeholder="e.g., Install drywall in unit 3A"
                  className={cn(
                    "w-full min-h-[52px] px-4 py-3 rounded-lg border resize-none",
                    "bg-background text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    "transition-shadow"
                  )}
                  autoFocus={index === 0}
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '52px',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </div>
              {draftTasks.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddTask}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add More
        </Button>
      </div>

      {/* Bottom Actions */}
      <div className="flex-shrink-0 border-t border-border p-4 space-y-2">
        <Button
          onClick={onNext}
          disabled={!hasValidTasks}
          className="w-full"
          size="lg"
        >
          Next: Add Details
        </Button>
        <Button
          variant="secondary"
          onClick={onQuickCreate}
          disabled={!hasValidTasks}
          className="w-full"
          size="lg"
        >
          Quick Create
        </Button>
      </div>
    </div>
  );
}

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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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
      <div className={cn(
        "flex-shrink-0 border-b border-border space-y-3",
        isMobile ? "p-3" : "p-4"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={cn(
              "font-semibold",
              isMobile ? "text-base" : "text-lg"
            )}>{jobsiteName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">New Task</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </Button>
        </div>

        {/* Date Selector */}
        <div className={cn("flex items-center", isMobile ? "gap-1.5" : "gap-2")}>
          <Button
            variant={format(selectedDate, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd') ? 'default' : 'outline'}
            size="sm"
            className={isMobile ? "h-8 px-2.5 text-xs" : ""}
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
            className={isMobile ? "h-8 px-2.5 text-xs" : ""}
            onClick={() => {
              const tomorrow = addDays(startOfToday(), 1);
              setSelectedDate(tomorrow);
              onDraftTasksChange(draftTasks.map(t => ({ ...t, date: format(tomorrow, 'yyyy-MM-dd') })));
            }}
          >
            {isMobile ? "Tmrw" : "Tomorrow"}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn("flex-1", isMobile ? "h-8 text-xs" : "")}
              >
                <CalendarIcon className={isMobile ? "w-3 h-3 mr-1.5" : "w-4 h-4 mr-2"} />
                {format(selectedDate, isMobile ? 'MMM d' : 'MMM d, yyyy')}
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
      <div className={cn(
        "flex-1 overflow-y-auto space-y-3",
        isMobile ? "p-3" : "p-4"
      )}>
        {!isMobile && (
          <label className="text-sm font-medium text-muted-foreground">
            What needs to be done?
          </label>
        )}

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
                  placeholder={isMobile ? "Task description..." : "e.g., Install drywall in unit 3A"}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border resize-none",
                    "bg-background text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    "transition-shadow",
                    isMobile ? "min-h-[44px] text-sm" : "min-h-[52px]"
                  )}
                  autoFocus={index === 0}
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: isMobile ? '44px' : '52px',
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
          className={cn("w-full", isMobile ? "h-9 text-xs" : "")}
        >
          <Plus className={isMobile ? "w-3 h-3 mr-1.5" : "w-4 h-4 mr-2"} />
          Add More
        </Button>
      </div>

      {/* Bottom Actions */}
      <div className={cn(
        "flex-shrink-0 border-t border-border",
        isMobile ? "p-3 space-y-1.5" : "p-4 space-y-2"
      )}>
        <Button
          onClick={onNext}
          disabled={!hasValidTasks}
          className="w-full"
          size={isMobile ? "default" : "lg"}
        >
          {isMobile ? "Next" : "Next: Add Details"}
        </Button>
        <Button
          variant="secondary"
          onClick={onQuickCreate}
          disabled={!hasValidTasks}
          className="w-full"
          size={isMobile ? "default" : "lg"}
        >
          {isMobile ? "Quick Add" : "Quick Create"}
        </Button>
      </div>
    </div>
  );
}

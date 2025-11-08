import { TaskFilters } from '@/hooks/useJobsiteTasksAdvanced';
import { useTaskTags } from '@/hooks/useJobsiteTasksAdvanced';
import { useEmployees } from '@/hooks/new/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskFilterPanelProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onClearFilters: () => void;
}

export function TaskFilterPanel({ filters, onFiltersChange, onClearFilters }: TaskFilterPanelProps) {
  const { data: tags = [] } = useTaskTags();
  const { data: employeesData } = useEmployees();
  
  const users = employeesData?.activeEmployees || [];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const activeFilterCount = [
    filters.status,
    filters.priority,
    filters.trade,
    filters.taskDate,
    filters.assigneeIds?.length ? filters.assigneeIds : null,
    filters.tagIds?.length ? filters.tagIds : null,
  ].filter(Boolean).length;

  const handleStatusToggle = (status: string) => {
    onFiltersChange({
      ...filters,
      status: filters.status === status ? undefined : status as TaskFilters['status'],
    });
  };

  const handlePriorityToggle = (priority: string) => {
    onFiltersChange({
      ...filters,
      priority: filters.priority === priority ? undefined : priority as TaskFilters['priority'],
    });
  };

  const handleEmployeeToggle = (userId: string) => {
    const current = filters.assigneeIds || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    onFiltersChange({
      ...filters,
      assigneeIds: updated.length > 0 ? updated : undefined,
    });
  };

  const handleTagToggle = (tagId: string) => {
    const current = filters.tagIds || [];
    const updated = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId];
    onFiltersChange({
      ...filters,
      tagIds: updated.length > 0 ? updated : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {filters.status ? statusOptions.find(s => s.value === filters.status)?.label : 'All Statuses'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={filters.status === option.value}
                    onCheckedChange={() => handleStatusToggle(option.value)}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <Label>Priority</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {filters.priority ? priorityOptions.find(p => p.value === filters.priority)?.label : 'All Priorities'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              {priorityOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={filters.priority === option.value}
                    onCheckedChange={() => handlePriorityToggle(option.value)}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Trade Filter */}
        <div className="space-y-2">
          <Label>Trade</Label>
          <Input
            placeholder="Filter by trade..."
            value={filters.trade || ''}
            onChange={(e) => onFiltersChange({ ...filters, trade: e.target.value || undefined })}
          />
        </div>

        {/* Assignees Filter */}
        <div className="space-y-2">
          <Label>Assignees</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {filters.assigneeIds && filters.assigneeIds.length > 0
                  ? `${filters.assigneeIds.length} selected`
                  : 'All Assignees'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 max-h-80 overflow-y-auto" align="start">
              {users.map((user) => (
                <label
                  key={user.user_id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={filters.assigneeIds?.includes(user.user_id)}
                    onCheckedChange={() => handleEmployeeToggle(user.user_id)}
                  />
                  <span className="text-sm">{user.first_name} {user.last_name}</span>
                </label>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Tags Filter */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {filters.tagIds && filters.tagIds.length > 0
                  ? `${filters.tagIds.length} selected`
                  : 'All Tags'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 max-h-80 overflow-y-auto" align="start">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={filters.tagIds?.includes(tag.id)}
                    onCheckedChange={() => handleTagToggle(tag.id)}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm">{tag.label}</span>
                </label>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find(s => s.value === filters.status)?.label}
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, status: undefined })}
                className="hover:bg-background/50 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="secondary" className="gap-1">
              Priority: {priorityOptions.find(p => p.value === filters.priority)?.label}
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, priority: undefined })}
                className="hover:bg-background/50 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.trade && (
            <Badge variant="secondary" className="gap-1">
              Trade: {filters.trade}
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, trade: undefined })}
                className="hover:bg-background/50 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

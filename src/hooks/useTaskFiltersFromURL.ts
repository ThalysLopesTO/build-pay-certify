import { useSearchParams } from 'react-router-dom';
import { TaskFilters } from './useJobsiteTasksAdvanced';
import { format } from 'date-fns';

export const useTaskFiltersFromURL = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filters: TaskFilters = {
    taskDate: searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'),
    status: (searchParams.get('status') as any) || undefined,
    priority: (searchParams.get('priority') as any) || undefined,
    assigneeIds: searchParams.get('assignees')?.split(',').filter(Boolean) || undefined,
    trade: searchParams.get('trade') || undefined,
    tagIds: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
  };
  
  const updateFilters = (newFilters: Partial<TaskFilters>) => {
    const params = new URLSearchParams(searchParams);
    
    // Update or remove each filter
    if (newFilters.taskDate !== undefined) {
      if (newFilters.taskDate) {
        params.set('date', newFilters.taskDate);
      } else {
        params.delete('date');
      }
    }
    
    if (newFilters.status !== undefined) {
      if (newFilters.status) {
        params.set('status', newFilters.status);
      } else {
        params.delete('status');
      }
    }
    
    if (newFilters.priority !== undefined) {
      if (newFilters.priority) {
        params.set('priority', newFilters.priority);
      } else {
        params.delete('priority');
      }
    }
    
    if (newFilters.assigneeIds !== undefined) {
      if (newFilters.assigneeIds && newFilters.assigneeIds.length > 0) {
        params.set('assignees', newFilters.assigneeIds.join(','));
      } else {
        params.delete('assignees');
      }
    }
    
    if (newFilters.trade !== undefined) {
      if (newFilters.trade) {
        params.set('trade', newFilters.trade);
      } else {
        params.delete('trade');
      }
    }
    
    if (newFilters.tagIds !== undefined) {
      if (newFilters.tagIds && newFilters.tagIds.length > 0) {
        params.set('tags', newFilters.tagIds.join(','));
      } else {
        params.delete('tags');
      }
    }
    
    setSearchParams(params);
  };
  
  const clearFilters = () => {
    const params = new URLSearchParams();
    params.set('date', format(new Date(), 'yyyy-MM-dd'));
    setSearchParams(params);
  };
  
  return { filters, updateFilters, clearFilters };
};

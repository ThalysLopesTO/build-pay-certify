// Type definitions for Daily Tasks feature

export interface DailyTaskList {
  id: string;
  company_id: string;
  jobsite_id: string;
  title: string;
  for_date: string;
  status: 'open' | 'closed' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  closed_by?: string;
  jobsite?: {
    id: string;
    name: string;
    address?: string;
  };
}

export interface DailyTaskItem {
  id: string;
  list_id: string;
  parent_item_id?: string;
  title: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  is_done: boolean;
  done_at?: string;
  done_by?: string;
  order_index: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  children?: DailyTaskItem[];
  assignees?: Array<{
    user_id: string;
    user: {
      id: string;
      raw_user_meta_data: {
        firstName?: string;
        lastName?: string;
        photoUrl?: string;
      }
    }
  }>;
}

export interface DailyTaskItemAssignee {
  id: string;
  item_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by?: string;
}

export interface DailyTaskComment {
  id: string;
  list_id?: string;
  item_id?: string;
  author_id: string;
  body: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface DailyTaskTemplate {
  id: string;
  company_id: string;
  jobsite_id?: string;
  name: string;
  description?: string;
  template_data: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DailyTaskActivityLog {
  id: string;
  list_id?: string;
  item_id?: string;
  actor_id: string;
  action_type: string;
  details: any;
  created_at: string;
}

export interface TaskProgress {
  total: number;
  completed: number;
  percentage: number;
}

export interface DailyTaskListWithProgress extends DailyTaskList {
  progress: TaskProgress;
  assignees?: any[];
  jobsite?: {
    id: string;
    name: string;
    address?: string;
  };
}

export interface JobsiteTaskSummary {
  jobsite_id: string;
  jobsite_name: string;
  jobsite_address?: string;
  today_progress: TaskProgress;
  open_lists_count: number;
}

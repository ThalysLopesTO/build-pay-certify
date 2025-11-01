export interface DailyTaskList {
  id: string;
  title: string;
  jobsite_id: string;
  company_id: string;
  for_date: string;
  status: 'open' | 'closed';
  created_by: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface DailyTaskItem {
  id: string;
  list_id: string;
  title: string;
  notes: string | null;
  is_done: boolean;
  done_at: string | null;
  done_by: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | null;
  order_index: number;
  parent_item_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  daily_task_item_assignees?: DailyTaskAssignee[];
}

export interface DailyTaskAssignee {
  id: string;
  item_id: string;
  user_id: string;
  assigned_by: string | null;
  assigned_at: string;
  user_profiles: {
    user_id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null;
}

export interface DailyTaskItemWithAssignees extends DailyTaskItem {
  assignees: DailyTaskAssignee[];
}

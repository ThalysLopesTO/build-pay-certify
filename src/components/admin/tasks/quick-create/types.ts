export interface DraftSubtask {
  id: string; // temp ID for UI
  title: string;
  assigneeIds?: string[];
  tagIds?: string[];
  notes?: string;
}

export interface DraftTask {
  id: string; // temp ID for UI
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  trade?: string;
  assigneeIds?: string[];
  tagIds?: string[];
  dueTime?: string; // HH:MM
  subtasks?: DraftSubtask[];
}


export interface Notification {
  id: string;
  company_id: string;
  title: string;
  description: string;
  type: 'certificate' | 'jobsite' | 'material_request' | 'attention_report';
  related_id: string | null;
  user_role: 'admin' | 'foreman';
  target_user_id: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  updated_at: string;
  redirect_to: string | null;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  byType: {
    certificate: number;
    jobsite: number;
    material_request: number;
    attention_report: number;
  };
}

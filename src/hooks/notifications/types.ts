
export interface Notification {
  id: string;
  company_id: string;
  title: string;
  description: string;
  type: 'certificate' | 'jobsite' | 'material_request' | 'attention_report' | 'bill_due_soon' | 'bill_overdue' | 'invoice_due_soon' | 'invoice_overdue';
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
    bill_due_soon: number;
    bill_overdue: number;
    invoice_due_soon: number;
    invoice_overdue: number;
  };
}

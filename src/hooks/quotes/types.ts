
export interface Quote {
  id: string;
  company_id: string;
  quote_number: string;
  client_id?: string;
  client_name: string;
  client_company?: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  project_name: string;
  quote_date: string;
  expiry_date?: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';
  subtotal: number;
  tax: number;
  discount: number;
  total_amount: number;
  notes?: string;
  sent_date?: string;
  accepted_date?: string;
  declined_date?: string;
  invoice_id?: string;
  template?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  public_token?: string;
  client_viewed_at?: string;
  client_approved_at?: string;
  client_declined_at?: string;
  client_name_signed?: string;
  client_change_request?: string;
  client_change_requested_at?: string;
  public_status?: 'awaiting_response' | 'changes_requested' | 'approved' | 'declined';
  admin_response_to_changes?: string;
  admin_responded_at?: string;
  admin_responded_by?: string;
}

export interface QuoteLineItem {
  id: string;
  quote_id: string;
  description: string;
  vendor?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

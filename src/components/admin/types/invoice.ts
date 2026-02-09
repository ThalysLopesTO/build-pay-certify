
export interface Invoice {
  id: string;
  invoice_number: string;
  title: string;
  client_id: string | null;
  client_company: string;
  client_email: string;
  client_address: string | null;
  client_phone: string | null;
  jobsite_id: string | null;
  discount: number;
  tax: number;
  subtotal: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'expired' | 'sent' | 'draft' | 'overdue';
  due_date: string;
  sent_date: string;
  notes: string | null;
  receipt_file_url: string | null;
  created_at: string;
  updated_at: string;
  jobsites?: {
    name: string;
    address: string | null;  
  } | null;
  invoice_line_items?: InvoiceLineItem[];
  // Stripe payment breakdown fields
  stripe_payment_intent_id?: string | null;
  stripe_charge_id?: string | null;
  stripe_transfer_id?: string | null;
  stripe_balance_transaction_id?: string | null;
  stripe_processing_fee_cents?: number | null;
  stackbuild_fee_cents?: number | null;
  net_to_company_cents?: number | null;
  payment_currency?: string | null;
  payment_method_type?: string | null;
  paid_at?: string | null;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceData {
  title: string;
  invoice_number?: string;
  client_id?: string;
  client_company: string;
  client_email: string;
  client_address: string;
  client_phone: string;
  discount: number;
  tax: number;
  due_date: string;
  notes: string | null;
  line_items: {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }[];
}

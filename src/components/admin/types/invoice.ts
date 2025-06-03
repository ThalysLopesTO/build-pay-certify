
export interface Invoice {
  id: string;
  invoice_number: string;
  title: string;
  client_company: string;
  client_email: string;
  jobsite_id: string | null;
  discount: number;
  tax: number;
  subtotal: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'expired';
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
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceData {
  title: string;
  client_company: string;
  client_email: string;
  jobsite_id: string | null;
  discount: number;
  tax: number;
  due_date: string;
  notes: string | null;
  line_items: {
    description: string;
    amount: number;
  }[];
}

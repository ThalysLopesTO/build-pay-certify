// Types for duplicate detection in receipt scanning

export interface DuplicateCandidate {
  id: string;
  expense_title: string;
  vendor_payee: string;
  expense_date: string;
  amount: number;
  category_id: string | null;
  attachment_url: string | null;
  created_at: string;
  receipt_hash: string | null;
  score: number;
}

export interface DuplicateDecision {
  status: 'none' | 'confirmed' | 'ignored';
  duplicateOfId: string | null;
}

export interface DuplicateInfo {
  receiptHash: string | null;
  vendorDetected: string;
  dateDetected: string;
  amountDetected: number;
  categoryDetectedId: string | null;
  duplicateStatus: 'none' | 'confirmed' | 'ignored';
  duplicateOfId: string | null;
  duplicateCandidates: DuplicateCandidate[];
}

export interface ExtractionResultWithDetected {
  vendor_payee: string;
  expense_date: string;
  amount: number;
  category_id: string | null;
  category_guess: string;
  subcategory_guess: string | null;
  confidence: {
    vendor: 'high' | 'medium' | 'low';
    date: 'high' | 'medium' | 'low';
    amount: 'high' | 'medium' | 'low';
    category: 'high' | 'medium' | 'low';
  };
  expense_title: string;
  line_items?: Array<{ description: string; amount: number }>;
  raw: object;
  // New detected fields
  vendor_detected?: string;
  date_detected?: string;
  amount_detected?: number;
  category_detected_id?: string | null;
}


export interface AttentionReportData {
  jobsiteId: string;
  reportDate: string;
  reportTime: string;
  message: string;
  attachments?: File[];
}

export interface AttentionReport {
  id: string;
  submitted_by: string;
  company_id: string;
  jobsite_id: string;
  report_date: string;
  report_time: string;
  message: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  jobsites?: { name: string };
  user_profiles?: { first_name: string; last_name: string };
  attachments?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
  }>;
}

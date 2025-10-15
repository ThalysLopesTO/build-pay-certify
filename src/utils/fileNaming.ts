import { format, min, max } from 'date-fns';
import { DailyReport } from '@/hooks/useDailyReports';

/**
 * Sanitizes a string to be safe for use in filenames
 */
const sanitizeFileName = (name: string): string => {
  return name
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

/**
 * Generates a descriptive filename for an individual daily report PDF
 * Format: DailyReport_[JobsiteName]_[Date]_[SubmitterName].pdf
 */
export const generatePDFFileName = (report: DailyReport): string => {
  const jobsiteName = sanitizeFileName(report.jobsites?.name || 'Unknown');
  const date = format(new Date(report.report_date), 'yyyy-MM-dd');
  const firstName = report.user_profiles?.first_name || '';
  const lastName = report.user_profiles?.last_name || '';
  const submitter = sanitizeFileName(`${firstName}_${lastName}`.trim() || 'Unknown');
  
  return `DailyReport_${jobsiteName}_${date}_${submitter}.pdf`;
};

/**
 * Generates a descriptive filename for a ZIP archive of multiple daily reports
 * Format: DailyReports_[CompanyName]_[MinDate]_to_[MaxDate]_[Timestamp].zip
 */
export const generateZipFileName = (
  reports: DailyReport[], 
  companyName?: string
): string => {
  const safeName = sanitizeFileName(companyName || 'Company');
  
  // Get date range from reports
  const dates = reports.map(r => new Date(r.report_date));
  const minDate = format(min(dates), 'yyyy-MM-dd');
  const maxDate = format(max(dates), 'yyyy-MM-dd');
  
  // Timestamp for uniqueness
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  
  // If same date, use single date format
  if (minDate === maxDate) {
    return `DailyReports_${safeName}_${minDate}_${timestamp}.zip`;
  }
  
  return `DailyReports_${safeName}_${minDate}_to_${maxDate}_${timestamp}.zip`;
};

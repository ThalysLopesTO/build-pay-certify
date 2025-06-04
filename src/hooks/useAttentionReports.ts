
// Re-export all attention reports hooks from a central location for backward compatibility
export { useAttentionReportsQuery as useAttentionReports } from './attention-reports/useAttentionReportsQuery';
export { useMyAttentionReportsQuery as useMyAttentionReports } from './attention-reports/useMyAttentionReportsQuery';
export { useAttentionReportSubmissionMutation as useAttentionReportSubmission } from './attention-reports/useAttentionReportSubmissionMutation';
export { useMarkReportAsReviewedMutation as useMarkReportAsReviewed } from './attention-reports/useMarkReportAsReviewedMutation';

// Re-export types
export type { AttentionReport, AttentionReportData } from './attention-reports/types';

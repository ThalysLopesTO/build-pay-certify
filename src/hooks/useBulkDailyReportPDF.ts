import JSZip from 'jszip';
import { useDailyReportPDF } from './useDailyReportPDF';
import { useToast } from '@/hooks/use-toast';
import { DailyReport } from './useDailyReports';
import { generatePDFFileName, generateZipFileName } from '@/utils/fileNaming';
import { getReportDisplayDate, getSubmissionDisplayTime } from '@/utils/timezone';

interface BulkPDFOptions {
  reports: DailyReport[];
  companySettings?: {
    company_name?: string;
    company_address?: string;
    company_phone?: string;
    company_email?: string;
    timezone?: string;
  };
  logoUrl?: string | null;
  onProgress?: (current: number, total: number) => void;
}

export const useBulkDailyReportPDF = () => {
  const { generateDailyReportPDF } = useDailyReportPDF();
  const { toast } = useToast();

  const generateBulkPDFs = async ({
    reports,
    companySettings,
    logoUrl,
    onProgress,
  }: BulkPDFOptions): Promise<Blob> => {
    const zip = new JSZip();
    const pdfFolder = zip.folder("Daily_Reports") || zip;

    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      
      try {
        // Transform report data for PDF generation
        const pdfData = {
          jobsite: report.jobsites?.name || 'Unknown Jobsite',
          address: report.jobsites?.address || 'Unknown Address',
          reportDate: getReportDisplayDate(report.report_date, companySettings?.timezone),
          submittedBy: report.user_profiles ? 
            `${report.user_profiles.first_name} ${report.user_profiles.last_name}` : 
            'Unknown User',
          submittedTime: getSubmissionDisplayTime(report.created_at, companySettings?.timezone),
          summary: report.summary,
          photos: (report.photos || []).map(photoUrl => ({
            src: photoUrl,
            caption: undefined,
            takenAt: undefined,
            mime: 'JPEG' as const
          }))
        };

        const pdfCompanySettings = {
          name: companySettings?.company_name,
          address: companySettings?.company_address,
          phone: companySettings?.company_phone,
          email: companySettings?.company_email,
          timezone: companySettings?.timezone,
        };

        // Generate PDF as Blob instead of auto-downloading
        const pdfBlob = await generateDailyReportPDF({
          report: pdfData,
          companySettings: pdfCompanySettings,
          logoUrl,
          returnBlob: true,
        });

        // Add to ZIP with descriptive filename
        const fileName = generatePDFFileName(report);
        pdfFolder.file(fileName, pdfBlob);

        // Update progress
        if (onProgress) {
          onProgress(i + 1, reports.length);
        }
      } catch (error) {
        console.error(`Error generating PDF for report ${report.id}:`, error);
        // Continue with other reports even if one fails
        toast({
          title: "Warning",
          description: `Failed to generate PDF for report from ${report.jobsites?.name || 'Unknown'}. Continuing with others...`,
          variant: "destructive",
        });
      }
    }

    // Generate ZIP file with compression
    const zipBlob = await zip.generateAsync({ 
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    return zipBlob;
  };

  const downloadZipFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return { generateBulkPDFs, downloadZipFile };
};

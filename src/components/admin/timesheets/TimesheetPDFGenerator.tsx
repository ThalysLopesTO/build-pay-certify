
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Receipt } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';

interface TimesheetPDFGeneratorProps {
  timesheet?: any;
  timesheets?: any[];
  isDownloadingAll?: boolean;
  onDownloadSingle?: (timesheet: any) => void;
  onDownloadAll?: () => void;
}

const TimesheetPDFGenerator: React.FC<TimesheetPDFGeneratorProps> = ({
  timesheet,
  timesheets = [],
  isDownloadingAll = false,
  onDownloadSingle,
  onDownloadAll
}) => {
  const { settings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();

  const formatWeekRange = (weekStartDate: string) => {
    const startDate = new Date(weekStartDate);
    const endDate = addDays(startDate, 6);
    
    const startFormatted = format(startDate, 'MMM dd');
    const endFormatted = format(endDate, 'MMM dd');
    
    return `${startFormatted} – ${endFormatted}`;
  };

  const generateTimesheetHTML = (timesheetData: any) => {
    const weekRange = formatWeekRange(timesheetData.week_start_date);
    const startDate = format(new Date(timesheetData.week_start_date), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(timesheetData.week_start_date), 6), 'yyyy-MM-dd');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Timesheet - ${timesheetData.employee_name} - ${weekRange}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.4;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .logo {
              max-height: 60px;
              max-width: 200px;
            }
            .company-info {
              text-align: right;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
            }
            .timesheet-title {
              font-size: 20px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
              color: #374151;
            }
            .employee-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
              padding: 15px;
              background-color: #f9fafb;
              border-radius: 8px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
            }
            .label {
              font-weight: bold;
              color: #374151;
            }
            .hours-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .hours-table th,
            .hours-table td {
              border: 1px solid #d1d5db;
              padding: 12px;
              text-align: center;
            }
            .hours-table th {
              background-color: #f3f4f6;
              font-weight: bold;
              color: #374151;
            }
            .total-row {
              background-color: #fef3c7;
              font-weight: bold;
            }
            .summary-section {
              margin-top: 20px;
              padding: 15px;
              background-color: #f0f9ff;
              border-radius: 8px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .notes-section {
              margin: 20px 0;
              padding: 15px;
              background-color: #f9fafb;
              border-radius: 8px;
            }
            .signature-section {
              margin-top: 40px;
              padding: 20px 0;
              border-top: 1px solid #e5e7eb;
            }
            .signature-line {
              border-bottom: 1px solid #9ca3af;
              width: 300px;
              margin: 10px 0;
              height: 40px;
            }
            @media print {
              body { margin: 0; }
              .header { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              ${logoUrl ? `<img src="${logoUrl}" alt="Company Logo" class="logo">` : ''}
            </div>
            <div class="company-info">
              <div class="company-name">${settings?.company_name || 'Company Name'}</div>
              <div>${settings?.company_address || ''}</div>
              <div>${settings?.company_phone || ''}</div>
            </div>
          </div>

          <div class="timesheet-title">Weekly Timesheet</div>

          <div class="employee-info">
            <div class="info-item">
              <span class="label">Employee:</span>
              <span>${timesheetData.employee_name}</span>
            </div>
            <div class="info-item">
              <span class="label">Job Site:</span>
              <span>${timesheetData.jobsite_name}</span>
            </div>
            <div class="info-item">
              <span class="label">Week Range:</span>
              <span>${weekRange}</span>
            </div>
            <div class="info-item">
              <span class="label">Hourly Rate:</span>
              <span>$${timesheetData.hourly_rate || '0.00'}</span>
            </div>
          </div>

          <table class="hours-table">
            <thead>
              <tr>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
                <th>Saturday</th>
                <th>Sunday</th>
                <th>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${timesheetData.monday_hours || 0}</td>
                <td>${timesheetData.tuesday_hours || 0}</td>
                <td>${timesheetData.wednesday_hours || 0}</td>
                <td>${timesheetData.thursday_hours || 0}</td>
                <td>${timesheetData.friday_hours || 0}</td>
                <td>${timesheetData.saturday_hours || 0}</td>
                <td>${timesheetData.sunday_hours || 0}</td>
                <td class="total-row">${timesheetData.total_hours || 0}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary-section">
            <h3>Summary</h3>
            <div class="summary-grid">
              <div class="info-item">
                <span class="label">Total Hours:</span>
                <span>${timesheetData.total_hours || 0}</span>
              </div>
              <div class="info-item">
                <span class="label">Hourly Rate:</span>
                <span>$${timesheetData.hourly_rate || '0.00'}</span>
              </div>
              <div class="info-item">
                <span class="label">Additional Expenses:</span>
                <span>$${timesheetData.additional_expense || '0.00'}</span>
              </div>
              <div class="info-item">
                <span class="label">Total Gross Pay:</span>
                <span><strong>$${timesheetData.gross_pay || '0.00'}</strong></span>
              </div>
            </div>
          </div>

          ${timesheetData.notes ? `
            <div class="notes-section">
              <h3>Notes</h3>
              <p>${timesheetData.notes}</p>
            </div>
          ` : ''}

          <div class="signature-section">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
              <div>
                <p><strong>Employee Signature:</strong></p>
                <div class="signature-line"></div>
                <p style="margin-top: 5px; font-size: 12px;">Date: ___________</p>
              </div>
              <div>
                <p><strong>Supervisor Approval:</strong></p>
                <div class="signature-line"></div>
                <p style="margin-top: 5px; font-size: 12px;">Date: ___________</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const downloadPDF = (htmlContent: string, filename: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
    }
  };

  const handleSingleDownload = () => {
    if (!timesheet || !onDownloadSingle) return;
    
    const weekRange = formatWeekRange(timesheet.week_start_date);
    const startDate = format(new Date(timesheet.week_start_date), 'MMM-dd');
    const endDate = format(addDays(new Date(timesheet.week_start_date), 6), 'MMM-dd');
    const filename = `Timesheet-${timesheet.employee_name.replace(/\s+/g, '')}-${startDate}-to-${endDate}.pdf`;
    
    const htmlContent = generateTimesheetHTML(timesheet);
    downloadPDF(htmlContent, filename);
    onDownloadSingle(timesheet);
  };

  const handleBatchDownload = () => {
    if (!timesheets.length || !onDownloadAll) return;
    
    const batchHTML = timesheets.map((ts, index) => 
      generateTimesheetHTML(ts) + (index < timesheets.length - 1 ? '<div style="page-break-after: always;"></div>' : '')
    ).join('');
    
    const firstTimesheet = timesheets[0];
    const weekRange = formatWeekRange(firstTimesheet.week_start_date);
    const startDate = format(new Date(firstTimesheet.week_start_date), 'MMM-dd');
    const endDate = format(addDays(new Date(firstTimesheet.week_start_date), 6), 'MMM-dd');
    const filename = `All-Timesheets-${startDate}-to-${endDate}.pdf`;
    
    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>All Timesheets - ${weekRange}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            @media print { 
              body { margin: 0; }
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${batchHTML}
        </body>
      </html>
    `;
    
    downloadPDF(fullHTML, filename);
    onDownloadAll();
  };

  if (timesheet) {
    // Single timesheet download button
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSingleDownload}
        className="h-8 w-8 p-0"
        title="Download timesheet PDF"
      >
        <Receipt className="h-4 w-4" />
      </Button>
    );
  }

  // Batch download button
  return (
    <Button
      onClick={handleBatchDownload}
      disabled={isDownloadingAll || timesheets.length === 0}
      className="flex items-center gap-2"
    >
      <FileDown className="h-4 w-4" />
      Download All Timesheets (PDF)
    </Button>
  );
};

export default TimesheetPDFGenerator;

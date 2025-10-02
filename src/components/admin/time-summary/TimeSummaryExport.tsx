import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { JobsiteSummary } from '@/hooks/useTimeSummaryData';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TimeSummaryExportProps {
  data: JobsiteSummary[];
  dateRange: { start: Date; end: Date };
  companyName?: string;
  companyLogo?: string;
}

export const TimeSummaryExport: React.FC<TimeSummaryExportProps> = ({
  data,
  dateRange,
  companyName = 'Company',
  companyLogo,
}) => {
  const { toast } = useToast();

  const exportToCSV = () => {
    try {
      // Create CSV header
      const headers = ['Jobsite', 'Employee', 'Date', 'Check-In', 'Check-Out', 'Hours', 'Status'];
      const rows: string[][] = [headers];

      // Add data rows
      data.forEach((jobsite) => {
        jobsite.employees.forEach((employee) => {
          employee.daily_punches.forEach((punch) => {
            rows.push([
              jobsite.jobsite_name,
              employee.employee_name,
              punch.date ? format(new Date(punch.date), 'yyyy-MM-dd') : 'N/A',
              punch.check_in_time ? format(new Date(punch.check_in_time), 'HH:mm') : '--:--',
              punch.check_out_time ? format(new Date(punch.check_out_time), 'HH:mm') : '--:--',
              punch.hours_worked.toFixed(2),
              punch.status,
            ]);
          });
        });
      });

      // Convert to CSV string
      const csvContent = rows.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `time-summary-${format(dateRange.start, 'yyyy-MM-dd')}-to-${format(dateRange.end, 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'CSV Exported',
        description: 'Time summary has been exported to CSV successfully.',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export CSV. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Add company logo if available
      if (companyLogo) {
        try {
          doc.addImage(companyLogo, 'PNG', 15, yPos, 30, 30);
          yPos += 35;
        } catch (error) {
          console.error('Error adding logo:', error);
          yPos += 10;
        }
      }

      // Add company name and title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(16);
      doc.text('Time Summary Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      // Add date range
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Period: ${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`,
        pageWidth / 2,
        yPos,
        { align: 'center' }
      );
      yPos += 15;

      // Process each jobsite
      data.forEach((jobsite, jobsiteIndex) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Jobsite header
        doc.setFillColor(59, 130, 246);
        doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(jobsite.jobsite_name, 20, yPos + 2);

        const jobsiteTotal = jobsite.employees.reduce((sum, emp) => sum + emp.total_hours, 0);
        doc.text(`${jobsiteTotal.toFixed(2)} hrs`, pageWidth - 20, yPos + 2, { align: 'right' });
        yPos += 15;

        // Reset text color
        doc.setTextColor(0, 0, 0);

        // Process each employee
        jobsite.employees.forEach((employee) => {
          // Employee header
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text(`${employee.employee_name} - ${employee.total_hours.toFixed(2)} hours`, 20, yPos);
          yPos += 8;

          // Daily punches table
          const tableData = employee.daily_punches.map((punch) => [
            punch.date ? format(new Date(punch.date), 'MMM dd, yyyy') : 'N/A',
            punch.check_in_time ? format(new Date(punch.check_in_time), 'HH:mm') : '--:--',
            punch.check_out_time ? format(new Date(punch.check_out_time), 'HH:mm') : '--:--',
            punch.hours_worked.toFixed(2),
            punch.status,
          ]);

          (doc as any).autoTable({
            startY: yPos,
            head: [['Date', 'Check-In', 'Check-Out', 'Hours', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            margin: { left: 25 },
            columnStyles: {
              0: { cellWidth: 35 },
              1: { cellWidth: 25 },
              2: { cellWidth: 25 },
              3: { cellWidth: 20 },
              4: { cellWidth: 25 },
            },
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;
        });

        yPos += 5;
      });

      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')} - Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      doc.save(`time-summary-${format(dateRange.start, 'yyyy-MM-dd')}-to-${format(dateRange.end, 'yyyy-MM-dd')}.pdf`);

      toast({
        title: 'PDF Exported',
        description: 'Time summary has been exported to PDF successfully.',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex gap-3">
      <Button onClick={exportToCSV} variant="outline" className="gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        Export CSV
      </Button>
      <Button onClick={exportToPDF} variant="outline" className="gap-2">
        <FileText className="h-4 w-4" />
        Export PDF
      </Button>
    </div>
  );
};

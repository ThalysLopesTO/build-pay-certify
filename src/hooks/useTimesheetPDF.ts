import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TimesheetPDFData {
  timesheet: any;
  companySettings: any;
  jobsiteName: string;
  employeeName: string;
}

export const useTimesheetPDF = () => {
  const generateTimesheetPDF = async (data: TimesheetPDFData) => {
    try {
      const { timesheet, companySettings, jobsiteName, employeeName } = data;
      
      console.log('Generating PDF with data:', { timesheet, companySettings, jobsiteName, employeeName });
      
      // Validate required data
      if (!timesheet) {
        throw new Error('Timesheet data is required');
      }
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      
      // Header with company logo and info
      let yPosition = 20;
      
      // Company logo (if available)
      if (companySettings?.company_logo_url) {
        try {
          console.log('Loading company logo from:', companySettings.company_logo_url);
          const logoResponse = await fetch(companySettings.company_logo_url);
          if (!logoResponse.ok) {
            throw new Error(`Failed to fetch logo: ${logoResponse.status}`);
          }
          const logoBlob = await logoResponse.blob();
          const logoDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read logo file'));
            reader.readAsDataURL(logoBlob);
          });
          pdf.addImage(logoDataUrl, 'PNG', 15, 10, 40, 20);
          yPosition = 35;
        } catch (error) {
          console.error('Error loading company logo:', error);
          // Continue without logo
        }
      }
      
      // Company name
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(companySettings?.company_name || 'Company Name', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Weekly Timesheet', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      
      // Employee and job details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      
      const leftCol = 15;
      const rightCol = pageWidth / 2 + 10;
      
      pdf.text('Employee:', leftCol, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(employeeName || 'Unknown Employee', leftCol + 25, yPosition);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Jobsite:', rightCol, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(jobsiteName || 'Unknown Jobsite', rightCol + 20, yPosition);
      
      yPosition += 8;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Week Starting:', leftCol, yPosition);
      pdf.setFont('helvetica', 'normal');
      const weekStartDate = timesheet.week_start_date ? new Date(timesheet.week_start_date).toLocaleDateString() : 'N/A';
      pdf.text(weekStartDate, leftCol + 35, yPosition);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Hourly Rate:', rightCol, yPosition);
      pdf.setFont('helvetica', 'normal');
      const hourlyRate = timesheet.hourly_rate ? `$${Number(timesheet.hourly_rate).toFixed(2)}` : '$0.00';
      pdf.text(hourlyRate, rightCol + 30, yPosition);
      
      yPosition += 15;
      
      // Hours table
      const tableData = [
        ['Monday', (timesheet.monday_hours ? Number(timesheet.monday_hours).toFixed(2) : '0.00')],
        ['Tuesday', (timesheet.tuesday_hours ? Number(timesheet.tuesday_hours).toFixed(2) : '0.00')],
        ['Wednesday', (timesheet.wednesday_hours ? Number(timesheet.wednesday_hours).toFixed(2) : '0.00')],
        ['Thursday', (timesheet.thursday_hours ? Number(timesheet.thursday_hours).toFixed(2) : '0.00')],
        ['Friday', (timesheet.friday_hours ? Number(timesheet.friday_hours).toFixed(2) : '0.00')],
        ['Saturday', (timesheet.saturday_hours ? Number(timesheet.saturday_hours).toFixed(2) : '0.00')],
        ['Sunday', (timesheet.sunday_hours ? Number(timesheet.sunday_hours).toFixed(2) : '0.00')],
        ['Total Hours', (timesheet.total_hours ? Number(timesheet.total_hours).toFixed(2) : '0.00')]
      ];
      
      // Use the autoTable plugin
      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Day', 'Hours']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: leftCol },
        tableWidth: 70
      });
      
      yPosition = (pdf as any).lastAutoTable.finalY + 15;
      
      // Payment breakdown
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment Breakdown:', leftCol, yPosition);
      
      yPosition += 10;
      
      const totalHours = timesheet.total_hours ? Number(timesheet.total_hours) : 0;
      const hourlyRateNum = timesheet.hourly_rate ? Number(timesheet.hourly_rate) : 0;
      const additionalExpense = timesheet.additional_expense ? Number(timesheet.additional_expense) : 0;
      const grossPay = timesheet.gross_pay ? Number(timesheet.gross_pay) : 0;
      const calculatedTax = timesheet.calculated_tax ? Number(timesheet.calculated_tax) : 0;
      
      const breakdown = [
        ['Regular Hours:', `${totalHours.toFixed(2)} × $${hourlyRateNum.toFixed(2)}`, `$${(totalHours * hourlyRateNum).toFixed(2)}`],
        ['Additional Expenses:', '', `$${additionalExpense.toFixed(2)}`],
        ['Gross Pay:', '', `$${grossPay.toFixed(2)}`]
      ];
      
      if (timesheet.tax_included && calculatedTax > 0) {
        breakdown.push(['Tax:', '', `$${calculatedTax.toFixed(2)}`]);
        breakdown.push(['Total Pay:', '', `$${(grossPay + calculatedTax).toFixed(2)}`]);
      } else {
        breakdown.push(['Total Pay:', '', `$${grossPay.toFixed(2)}`]);
      }
      
      (pdf as any).autoTable({
        startY: yPosition,
        body: breakdown,
        theme: 'plain',
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'normal' },
          1: { cellWidth: 60, halign: 'center' },
          2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: leftCol },
        tableWidth: 150
      });
      
      yPosition = (pdf as any).lastAutoTable.finalY + 15;
      
      // Footer info
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const submittedDate = timesheet.created_at ? new Date(timesheet.created_at).toLocaleDateString() : 'N/A';
      const status = timesheet.status ? timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1) : 'Unknown';
      
      pdf.text(`Submitted: ${submittedDate}`, leftCol, yPosition);
      pdf.text(`Status: ${status}`, rightCol, yPosition);
      
      if (timesheet.status === 'approved') {
        yPosition += 20;
        pdf.text('Approved by: ________________________', leftCol, yPosition);
        pdf.text('Date: ________________________', rightCol, yPosition);
      }
      
      // Generate filename
      const employeeNameForFile = employeeName ? employeeName.replace(/\s+/g, '_') : 'Unknown_Employee';
      const weekStartForFile = timesheet.week_start_date ? new Date(timesheet.week_start_date).toISOString().split('T')[0] : 'unknown_date';
      const filename = `timesheet_${employeeNameForFile}_${weekStartForFile}.pdf`;
      
      console.log('Saving PDF with filename:', filename);
      
      // Download the PDF
      pdf.save(filename);
      
      console.log('PDF generated successfully');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };
  
  return { generateTimesheetPDF };
};
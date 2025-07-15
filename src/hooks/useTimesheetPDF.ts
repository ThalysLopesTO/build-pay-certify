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
    const { timesheet, companySettings, jobsiteName, employeeName } = data;
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header with company logo and info
    let yPosition = 20;
    
    // Company logo (if available)
    if (companySettings?.company_logo_url) {
      try {
        const logoResponse = await fetch(companySettings.company_logo_url);
        const logoBlob = await logoResponse.blob();
        const logoDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });
        pdf.addImage(logoDataUrl as string, 'PNG', 15, 10, 40, 20);
        yPosition = 35;
      } catch (error) {
        console.error('Error loading company logo:', error);
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
    pdf.text(employeeName, leftCol + 25, yPosition);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Jobsite:', rightCol, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(jobsiteName, rightCol + 20, yPosition);
    
    yPosition += 8;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Week Starting:', leftCol, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date(timesheet.week_start_date).toLocaleDateString(), leftCol + 35, yPosition);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Hourly Rate:', rightCol, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`$${timesheet.hourly_rate.toFixed(2)}`, rightCol + 30, yPosition);
    
    yPosition += 15;
    
    // Hours table
    const tableData = [
      ['Monday', timesheet.monday_hours?.toFixed(2) || '0.00'],
      ['Tuesday', timesheet.tuesday_hours?.toFixed(2) || '0.00'],
      ['Wednesday', timesheet.wednesday_hours?.toFixed(2) || '0.00'],
      ['Thursday', timesheet.thursday_hours?.toFixed(2) || '0.00'],
      ['Friday', timesheet.friday_hours?.toFixed(2) || '0.00'],
      ['Saturday', timesheet.saturday_hours?.toFixed(2) || '0.00'],
      ['Sunday', timesheet.sunday_hours?.toFixed(2) || '0.00'],
      ['Total Hours', timesheet.total_hours?.toFixed(2) || '0.00']
    ];
    
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
    
    const breakdown = [
      ['Regular Hours:', `${timesheet.total_hours?.toFixed(2) || '0.00'} × $${timesheet.hourly_rate.toFixed(2)}`, `$${(timesheet.total_hours * timesheet.hourly_rate).toFixed(2)}`],
      ['Additional Expenses:', '', `$${timesheet.additional_expense?.toFixed(2) || '0.00'}`],
      ['Gross Pay:', '', `$${timesheet.gross_pay?.toFixed(2) || '0.00'}`]
    ];
    
    if (timesheet.tax_included && timesheet.calculated_tax) {
      breakdown.push(['Tax:', '', `$${timesheet.calculated_tax.toFixed(2)}`]);
      breakdown.push(['Total Pay:', '', `$${(timesheet.gross_pay + timesheet.calculated_tax).toFixed(2)}`]);
    } else {
      breakdown.push(['Total Pay:', '', `$${timesheet.gross_pay?.toFixed(2) || '0.00'}`]);
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
    pdf.text(`Submitted: ${new Date(timesheet.created_at).toLocaleDateString()}`, leftCol, yPosition);
    pdf.text(`Status: ${timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}`, rightCol, yPosition);
    
    if (timesheet.status === 'approved') {
      yPosition += 20;
      pdf.text('Approved by: ________________________', leftCol, yPosition);
      pdf.text('Date: ________________________', rightCol, yPosition);
    }
    
    // Generate filename
    const filename = `timesheet_${employeeName.replace(/\s+/g, '_')}_${new Date(timesheet.week_start_date).toISOString().split('T')[0]}.pdf`;
    
    // Download the PDF
    pdf.save(filename);
  };
  
  return { generateTimesheetPDF };
};
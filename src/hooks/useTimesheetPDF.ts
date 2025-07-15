import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const useTimesheetPDF = () => {
  const generateTimesheetPDF = async (data) => {
    try {
      const { timesheet, companySettings, jobsiteName, employeeName, logoUrl } = data;
      if (!timesheet) throw new Error('Timesheet data is required');

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;

      let yPosition = 20;
      const leftCol = 15;
      const rightCol = pageWidth / 2 + 10;

      // Company Logo
      if (logoUrl) {
        try {
          const logoRes = await fetch(logoUrl);
          const logoBlob = await logoRes.blob();
          const logoDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(logoBlob);
          });
          pdf.addImage(logoDataUrl, 'PNG', leftCol, 10, 40, 20);
          yPosition = 35;
        } catch (err) {
          console.warn('Logo failed to load:', err);
        }
      }

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(companySettings?.company_name || 'Company Name', pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Weekly Timesheet Report', pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 20;

      // Employee & Job Info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Employee:', leftCol, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(employeeName || 'Unknown', leftCol + 30, yPosition);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Jobsite:', rightCol, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(jobsiteName || 'Unknown', rightCol + 25, yPosition);

      yPosition += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Week Starting:', leftCol, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        timesheet.week_start_date ? new Date(timesheet.week_start_date).toLocaleDateString() : 'N/A',
        leftCol + 35,
        yPosition
      );

      pdf.setFont('helvetica', 'bold');
      pdf.text('Hourly Rate:', rightCol, yPosition);
      pdf.setFont('helvetica', 'normal');
      const hourlyRate = timesheet.hourly_rate ? `$${Number(timesheet.hourly_rate).toFixed(2)}` : '$0.00';
      pdf.text(hourlyRate, rightCol + 30, yPosition);

      yPosition += 15;

      // Hours Table
      const tableData = [
        ['Monday', (timesheet.monday_hours ?? 0).toFixed(2)],
        ['Tuesday', (timesheet.tuesday_hours ?? 0).toFixed(2)],
        ['Wednesday', (timesheet.wednesday_hours ?? 0).toFixed(2)],
        ['Thursday', (timesheet.thursday_hours ?? 0).toFixed(2)],
        ['Friday', (timesheet.friday_hours ?? 0).toFixed(2)],
        ['Saturday', (timesheet.saturday_hours ?? 0).toFixed(2)],
        ['Sunday', (timesheet.sunday_hours ?? 0).toFixed(2)],
        ['Total Hours', (timesheet.total_hours ?? 0).toFixed(2)]
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [['Day', 'Hours']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [50, 50, 50]
        },
        styles: {
          fontSize: 11,
          cellPadding: 4
        },
        margin: { left: leftCol },
        tableWidth: 'auto'
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 10;

      // Payment Breakdown
      const totalHours = Number(timesheet.total_hours ?? 0);
      const rate = Number(timesheet.hourly_rate ?? 0);
      const expenses = Number(timesheet.additional_expense ?? 0);
      const gross = Number(timesheet.gross_pay ?? 0);
      const tax = Number(timesheet.calculated_tax ?? 0);
      const withTax = timesheet.tax_included;

      const breakdown = [
        ['Regular Hours:', `${totalHours.toFixed(2)} × $${rate.toFixed(2)}`, `$${(totalHours * rate).toFixed(2)}`],
        ['Additional Expenses:', '', `$${expenses.toFixed(2)}`],
        ['Gross Pay:', '', `$${gross.toFixed(2)}`]
      ];

      if (withTax && tax > 0) {
        breakdown.push(['Tax:', '', `$${tax.toFixed(2)}`]);
        breakdown.push(['Total Pay:', '', `$${(gross + tax).toFixed(2)}`]);
      } else {
        breakdown.push(['Total Pay:', '', `$${gross.toFixed(2)}`]);
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment Summary', leftCol, yPosition);

      yPosition += 5;

      autoTable(pdf, {
        startY: yPosition,
        body: breakdown,
        theme: 'grid',
        styles: {
          fontSize: 11,
          halign: 'left',
          cellPadding: 5
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { halign: 'center' },
          2: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: leftCol },
        tableWidth: 'wrap'
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 20;

      // Footer
      const submittedDate = timesheet.created_at ? new Date(timesheet.created_at).toLocaleDateString() : 'N/A';
      const status = timesheet.status ? timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1) : 'Unknown';

      pdf.setFontSize(10);
      pdf.setTextColor(80);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Submitted: ${submittedDate}`, leftCol, yPosition);
      pdf.text(`Status: ${status}`, rightCol, yPosition);

      if (timesheet.status === 'approved') {
        yPosition += 20;
        pdf.text('Approved by: ________________________', leftCol, yPosition);
        pdf.text('Date: ________________________', rightCol, yPosition);
      }

      // Save File
      const fileEmployee = employeeName ? employeeName.replace(/\s+/g, '_') : 'Unknown';
      const weekDate = timesheet.week_start_date ? new Date(timesheet.week_start_date).toISOString().split('T')[0] : 'unknown';
      const filename = `timesheet_${fileEmployee}_${weekDate}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error('PDF Generation Failed:', err);
      throw err;
    }
  };

  return { generateTimesheetPDF };
};

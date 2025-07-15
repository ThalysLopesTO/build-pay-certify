import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const useTimesheetPDF = () => {
  const generateTimesheetPDF = async (data) => {
    try {
      const { timesheet, companySettings, jobsiteName, employeeName, logoUrl, workerType } = data;
      if (!timesheet) throw new Error('Timesheet data is required');

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const leftCol = 15;
      const rightCol = pageWidth / 2 + 10;
      let y = 15;

      // Load and draw logo
      if (logoUrl) {
        try {
          const res = await fetch(logoUrl);
          const blob = await res.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result;
              if (typeof result === 'string') {
                resolve(result);
              } else {
                reject(new Error('Failed to read file as data URL'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          pdf.addImage(base64, 'PNG', leftCol, y, 25, 12); // Smaller logo
        } catch (err) {
          console.warn('Failed to load logo:', err);
        }
      }

      // Company Name & Report Title
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(companySettings?.company_name || 'Company Name', pageWidth / 2, y + 5, { align: 'center' });

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Weekly Timesheet Report', pageWidth / 2, y + 12, { align: 'center' });

      y += 22;

      // Employee & Job Info
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Employee:', leftCol, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(employeeName || 'Unknown', leftCol + 25, y);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Jobsite:', rightCol, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(jobsiteName || 'Unknown', rightCol + 25, y);

      y += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Week Starting:', leftCol, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        timesheet.week_start_date ? new Date(timesheet.week_start_date).toLocaleDateString() : 'N/A',
        leftCol + 35, y
      );

      pdf.setFont('helvetica', 'bold');
      pdf.text('Hourly Rate:', rightCol, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        timesheet.hourly_rate ? `$${Number(timesheet.hourly_rate).toFixed(2)}` : '$0.00',
        rightCol + 30, y
      );

      y += 8;

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
        startY: y,
        head: [['Day', 'Hours']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [50, 50, 50]
        },
        margin: { left: leftCol },
        tableWidth: 80
      });

      y = (pdf as any).lastAutoTable.finalY + 6;

      // Payment Summary
      const total = Number(timesheet.total_hours ?? 0);
      const rate = Number(timesheet.hourly_rate ?? 0);
      const gross = Number(timesheet.gross_pay ?? 0);
      const tax = Number(timesheet.calculated_tax ?? 0);
      const expenses = Number(timesheet.additional_expense ?? 0);
      const taxIncluded = timesheet.tax_included;

      const breakdown = [
        ['Regular Hours:', `${total.toFixed(2)} × $${rate.toFixed(2)}`, `$${(total * rate).toFixed(2)}`],
        ['Additional Expenses:', '', `$${expenses.toFixed(2)}`],
        ['Gross Pay:', '', `$${gross.toFixed(2)}`]
      ];

      if (workerType === 'employee') {
        // Employee deductions
        const incomeTax = gross * 0.12;
        const cpp = gross * 0.0595;
        const ei = gross * 0.0163;
        const totalDeductions = incomeTax + cpp + ei;
        const netPay = gross - totalDeductions;

        breakdown.push(['', '', '']);
        breakdown.push(['Deductions:', '', '']);
        breakdown.push(['- Income Tax (12%):', '', `$${incomeTax.toFixed(2)}`]);
        breakdown.push(['- CPP (5.95%):', '', `$${cpp.toFixed(2)}`]);
        breakdown.push(['- EI (1.63%):', '', `$${ei.toFixed(2)}`]);
        breakdown.push(['Net Pay:', '', `$${netPay.toFixed(2)}`]);
      } else {
        // Subcontractor logic
        if (taxIncluded && tax > 0) {
          breakdown.push(['Tax:', '', `$${tax.toFixed(2)}`]);
          breakdown.push(['Total Pay:', '', `$${(gross + tax).toFixed(2)}`]);
        } else {
          breakdown.push(['Total Pay:', '', `$${gross.toFixed(2)}`]);
        }
      }

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment Summary', leftCol, y);

      y += 3;

      autoTable(pdf, {
        startY: y,
        body: breakdown,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 45, halign: 'center' },
          2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: leftCol },
        tableWidth: 'wrap'
      });

      y = (pdf as any).lastAutoTable.finalY + 10;

      // Footer
      pdf.setFontSize(9);
      const submittedDate = timesheet.created_at ? new Date(timesheet.created_at).toLocaleDateString() : 'N/A';
      const status = timesheet.status ? timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1) : 'Unknown';
      pdf.text(`Submitted: ${submittedDate}`, leftCol, y);
      pdf.text(`Status: ${status}`, rightCol, y);

      if (timesheet.status === 'approved') {
        y += 14;
        pdf.text('Approved by: ________________________', leftCol, y);
        pdf.text('Date: ________________________', rightCol, y);
      }

      // Save
      const fileName = `timesheet_${(employeeName || 'Unknown').replace(/\s+/g, '_')}_${new Date(timesheet.week_start_date).toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      throw err;
    }
  };

  return { generateTimesheetPDF };
};

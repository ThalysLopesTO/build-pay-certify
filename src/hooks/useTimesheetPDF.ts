import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExtendedJsPDF extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const useTimesheetPDF = () => {
  const generateTimesheetPDF = async (data: any) => {
    try {
      const { timesheet, companySettings, jobsiteName, employeeName, logoUrl, workerType } = data;
      if (!timesheet) throw new Error('Timesheet data is required');

      const pdf = new jsPDF('p', 'mm', 'a4') as ExtendedJsPDF;
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 15;
      let y = margin;

      // Header
      if (logoUrl) {
        try {
          const res = await fetch(logoUrl);
          const blob = await res.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') resolve(reader.result);
              else reject();
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          pdf.addImage(base64, 'PNG', margin, y, 30, 15);
        } catch (err) {
          console.warn('Failed to load logo:', err);
        }
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(companySettings?.company_name || 'Company Name', pageWidth / 2, y + 10, { align: 'center' });

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Weekly Timesheet Summary', pageWidth / 2, y + 18, { align: 'center' });
      y += 30;

      // Employee & Jobsite
      autoTable(pdf, {
        startY: y,
        theme: 'grid',
        head: [['Employee Name', 'Jobsite', 'Week Starting', 'Hourly Rate']],
        body: [[
          employeeName || 'Unknown',
          jobsiteName || 'Unknown',
          timesheet.week_start_date ? new Date(timesheet.week_start_date).toLocaleDateString() : 'N/A',
          timesheet.hourly_rate ? `$${Number(timesheet.hourly_rate).toFixed(2)}` : '$0.00'
        ]],
        margin: { left: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 150, 243], textColor: [255, 255, 255] }
      });

      y = pdf.lastAutoTable.finalY + 4;

      // Weekly Hours
      const weekData = [
        ['Monday', timesheet.monday_hours ?? 0],
        ['Tuesday', timesheet.tuesday_hours ?? 0],
        ['Wednesday', timesheet.wednesday_hours ?? 0],
        ['Thursday', timesheet.thursday_hours ?? 0],
        ['Friday', timesheet.friday_hours ?? 0],
        ['Saturday', timesheet.saturday_hours ?? 0],
        ['Sunday', timesheet.sunday_hours ?? 0],
        ['Total Hours', timesheet.total_hours ?? 0]
      ];

      autoTable(pdf, {
        startY: y,
        theme: 'striped',
        head: [['Day', 'Hours Worked']],
        body: weekData.map(([day, hours]) => [day, Number(hours).toFixed(2)]),
        margin: { left: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255] }
      });

      y = pdf.lastAutoTable.finalY + 6;

      // Payroll Breakdown
      const gross = Number(timesheet.gross_pay ?? 0);
      const incomeTaxRate = timesheet.income_tax_rate ? Number(timesheet.income_tax_rate) / 100 : 0.20;
      const cppRate = timesheet.cpp_rate ? Number(timesheet.cpp_rate) / 100 : 0.0595;
      const eiRate = timesheet.ei_rate ? Number(timesheet.ei_rate) / 100 : 0.0235;
      const incomeTax = gross * incomeTaxRate;
      const cpp = gross * cppRate;
      const ei = gross * eiRate;
      const totalDeductions = incomeTax + cpp + ei;
      const netPay = gross - totalDeductions;

      if (workerType === 'employee') {
        autoTable(pdf, {
          startY: y,
          head: [['Earnings & Deductions', 'Rate', 'Amount']],
          body: [
            ['Gross Pay', '', `$${gross.toFixed(2)}`],
            ['Income Tax', `${(incomeTaxRate * 100).toFixed(2)}%`, `-$${incomeTax.toFixed(2)}`],
            ['CPP', `${(cppRate * 100).toFixed(2)}%`, `-$${cpp.toFixed(2)}`],
            ['EI', `${(eiRate * 100).toFixed(2)}%`, `-$${ei.toFixed(2)}`],
            ['Total Deductions', '', `-$${totalDeductions.toFixed(2)}`],
            ['Net Pay', '', `$${netPay.toFixed(2)}`]
          ],
          theme: 'grid',
          margin: { left: margin },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { fontStyle: 'bold' },
            2: { halign: 'right', fontStyle: 'bold' }
          },
          headStyles: { fillColor: [255, 111, 0], textColor: [255, 255, 255] }
        });
      } else {
        autoTable(pdf, {
          startY: y,
          body: [
            ['Total Pay', '', `$${gross.toFixed(2)}`]
          ],
          theme: 'grid',
          styles: { fontSize: 10 },
          margin: { left: margin },
          head: [['Payment Summary', '', '']],
          headStyles: { fillColor: [96, 125, 139], textColor: [255, 255, 255] }
        });
      }

      y = pdf.lastAutoTable.finalY + 8;

      // Footer
      pdf.setFontSize(9);
      const submittedDate = timesheet.created_at ? new Date(timesheet.created_at).toLocaleDateString() : 'N/A';
      const status = timesheet.status ? timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1) : 'Unknown';
      pdf.text(`Submitted: ${submittedDate}`, margin, y);
      pdf.text(`Status: ${status}`, pageWidth - margin * 5, y);

      if (timesheet.status === 'approved') {
        y += 10;
        pdf.text('Approved by: ________________________', margin, y);
        pdf.text('Date: ________________________', pageWidth - 80, y);
      }

      // Save PDF
      const fileName = `timesheet_${(employeeName || 'Unknown').replace(/\s+/g, '_')}_${new Date(timesheet.week_start_date).toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      throw err;
    }
  };

  return { generateTimesheetPDF };
};
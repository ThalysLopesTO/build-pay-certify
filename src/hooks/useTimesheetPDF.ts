/* eslint-disable @typescript-eslint/no-explicit-any */
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
      const {
        timesheet,
        companySettings,
        jobsiteName, // <-- must be passed from parent component
        employeeName,
        logoUrl,
        workerType,
      } = data;

      if (!timesheet) throw new Error('Timesheet data is required');

      const periods = Array.isArray(timesheet.periods) ? timesheet.periods : [{ days: [] }];
      const isBiWeekly = periods.length === 2;

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
      pdf.text(companySettings?.company_name || 'Company Name', pageWidth / 2, y + 10, {
        align: 'center',
      });

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const startDate = new Date(timesheet.week_start_date);
      const periodDays = isBiWeekly ? 14 : 7;
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (periodDays - 1));
      const periodTitle = `Timesheet Period: ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`;
      pdf.text(isBiWeekly ? 'Bi-Weekly Timesheet Summary' : 'Weekly Timesheet Summary', pageWidth / 2, y + 18, { align: 'center' });
      y += 30;

      // Employee & Jobsite Info
      autoTable(pdf, {
        startY: y,
        theme: 'grid',
        head: [['Employee Name', 'Jobsite', 'Period', 'Hourly Rate']],
        body: [
          [
            employeeName || 'Unknown',
            jobsiteName || 'Unknown Jobsite',
            periodTitle.replace('Timesheet Period: ', ''),
            timesheet.hourly_rate ? `$${Number(timesheet.hourly_rate).toFixed(2)}` : '$0.00',
          ],
        ],
        margin: { left: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 150, 243], textColor: [255, 255, 255] },
      });

      y = pdf.lastAutoTable.finalY + 4;
      const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      if (isBiWeekly && Array.isArray(periods[0].days) && Array.isArray(periods[1].days)) {
        const rows = dayNames.map(day => {
          const w1Hours = periods[0].days.find(d => d[day] !== undefined)?.[day] ?? 0;
          const w2Hours = periods[1].days.find(d => d[day] !== undefined)?.[day] ?? 0;
          return [day.charAt(0).toUpperCase() + day.slice(1), w1Hours.toFixed(2), w2Hours.toFixed(2)];
        });

        // Calculate totals
        const totalW1 = rows.reduce((sum, [, w1]) => sum + Number(w1), 0);
        const totalW2 = rows.reduce((sum, [, , w2]) => sum + Number(w2), 0);
        rows.push(['Total Hours', totalW1.toFixed(2), totalW2.toFixed(2)]);

        autoTable(pdf, {
          startY: y,
          head: [['Day', 'Hours Worked W1', 'Hours Worked W2']],
          body: rows,
          margin: { left: margin },
          styles: { halign: 'center', fontSize: 10 },
          columnStyles: { 0: { halign: 'left' } },
          headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255] },
        });

        y = pdf.lastAutoTable.finalY + 6;
      } else {
        // Fallback to weekly-style table
        const weekData = dayNames.map(day => {
          const hours = periods[0]?.days.find(d => d[day] !== undefined)?.[day] ?? 0;
          return [day.charAt(0).toUpperCase() + day.slice(1), hours.toFixed(2)];
        });

        const totalHours = weekData.reduce((sum, [, hours]) => sum + Number(hours), 0);

        weekData.push(['Total Hours', totalHours.toFixed(2)]);

        autoTable(pdf, {
          startY: y,
          theme: 'striped',
          head: [['Day', 'Hours Worked']],
          body: weekData.map(([day, hours]) => [day, Number(hours).toFixed(2)]),
          margin: { left: margin },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255] },
        });

        y = pdf.lastAutoTable.finalY + 6;
      }

      // Payroll Breakdown
      const gross = Number(timesheet.gross_pay ?? 0);
      const incomeTaxRate = timesheet.income_tax_rate
        ? Number(timesheet.income_tax_rate) / 100
        : 0.2;
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
            ['Net Pay', '', `$${netPay.toFixed(2)}`],
          ],
          theme: 'grid',
          margin: { left: margin },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { fontStyle: 'bold' },
            2: { halign: 'right', fontStyle: 'bold' },
          },
          headStyles: { fillColor: [255, 111, 0], textColor: [255, 255, 255] },
        });
      } else {
        autoTable(pdf, {
          startY: y,
          body: [['Total Pay', '', `$${gross.toFixed(2)}`]],
          theme: 'grid',
          styles: { fontSize: 10 },
          margin: { left: margin },
          head: [['Payment Summary', '', '']],
          headStyles: { fillColor: [96, 125, 139], textColor: [255, 255, 255] },
        });
      }

      y = pdf.lastAutoTable.finalY + 8;

      // Employee Notes section (cleaned)
      const employeeNotes = (() => {
        const raw = (timesheet as any).employee_notes ?? (typeof timesheet.notes === 'string' ? timesheet.notes : '');
        if (!raw) return '';
        return raw
          .split('\n')
          .filter((l: string) => !l.startsWith('__biweekly_json__='))
          .join('\n')
          .trim();
      })();

      if (employeeNotes) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Employee Notes', margin, y);
        y += 6;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const wrapped = pdf.splitTextToSize(employeeNotes, pageWidth - margin * 2);
        pdf.text(wrapped as unknown as string, margin, y);
        y += (Array.isArray(wrapped) ? wrapped.length : 1) * 5 + 4;
      }

      // Footer
      pdf.setFontSize(9);
      const submittedDate = timesheet.created_at
        ? new Date(timesheet.created_at).toLocaleDateString()
        : 'N/A';
      const status = timesheet.status
        ? timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)
        : 'Unknown';
      pdf.text(`Submitted: ${submittedDate}`, margin, y);
      pdf.text(`Status: ${status}`, pageWidth - margin * 5, y);

      if (timesheet.status === 'approved') {
        y += 10;
        pdf.text('Approved by: ________________________', margin, y);
        pdf.text('Date: ________________________', pageWidth - 80, y);
      }

      // Save
      const fileName = `timesheet_${(employeeName || 'Unknown')
        .replace(/\\s+/g, '_')
        .toLowerCase()}_${new Date(timesheet.week_start_date)
          .toISOString()
          .split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      throw err;
    }
  };

  return { generateTimesheetPDF };
};

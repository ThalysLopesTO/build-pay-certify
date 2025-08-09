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

      const isBiWeekly = (companySettings as any)?.timesheet_frequency === 'bi-weekly';

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

      // Hours Table (supports bi-weekly)
      const hasBiWeeklyBreakdown = isBiWeekly && typeof timesheet.notes === 'string' && timesheet.notes.includes('__biweekly_json__=');
      if (hasBiWeeklyBreakdown) {
        // Parse breakdown from notes
        let days: { date: string; label: string; hours: number }[] = [];
        try {
          const match = timesheet.notes.split('\n').find((line: string) => line.startsWith('__biweekly_json__='));
          if (match) {
            const jsonBase64 = match.split('=')[1];
            const parsed = JSON.parse(atob(jsonBase64));
            days = Array.isArray(parsed?.days) ? parsed.days : [];
          }
        } catch (e) {
          console.warn('Failed to parse bi-weekly breakdown from notes');
        }

        if (days.length === 14) {
          // Show prominent period label
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(periodTitle, margin, y);
          y += 6;

          // Build two 7-day tables with headers "Day – Mon dd"
          const formatHeader = (d: {date:string; label:string}) => {
            const dt = new Date(d.date);
            const day = dt.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
            return `${d.label} – ${day}`;
          };

          const week1 = days.slice(0,7);
          const week2 = days.slice(7,14);

          autoTable(pdf, {
            startY: y,
            theme: 'grid',
            head: [week1.map(d => formatHeader(d))],
            body: [week1.map(d => Number(d.hours || 0).toFixed(2))],
            margin: { left: margin },
            styles: { fontSize: 9, halign: 'center' },
            headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255] },
          });
          y = pdf.lastAutoTable.finalY + 6;

          autoTable(pdf, {
            startY: y,
            theme: 'grid',
            head: [week2.map(d => formatHeader(d))],
            body: [week2.map(d => Number(d.hours || 0).toFixed(2))],
            margin: { left: margin },
            styles: { fontSize: 9, halign: 'center' },
            headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255] },
          });
          y = pdf.lastAutoTable.finalY + 6;
        }
      }

      if (!hasBiWeeklyBreakdown) {
        // Fallback to weekly-style table with 7 days
        const weekData = [
          ['Monday', timesheet.monday_hours ?? 0],
          ['Tuesday', timesheet.tuesday_hours ?? 0],
          ['Wednesday', timesheet.wednesday_hours ?? 0],
          ['Thursday', timesheet.thursday_hours ?? 0],
          ['Friday', timesheet.friday_hours ?? 0],
          ['Saturday', timesheet.saturday_hours ?? 0],
          ['Sunday', timesheet.sunday_hours ?? 0],
          ['Total Hours', timesheet.total_hours ?? 0],
        ];

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

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const useTimesheetPDF = () => {
  const generateTimesheetPDF = async (data) => {
    try {
      const { timesheet, companySettings, jobsiteName, employeeName, logoUrl, workerType } = data;
      if (!timesheet) throw new Error('Timesheet data is required');

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 15;
      let y = margin;

      // Header with logo
      if (logoUrl) {
        try {
          const res = await fetch(logoUrl);
          const blob = await res.blob();
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject();
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

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Weekly Timesheet with Payroll Breakdown', pageWidth / 2, y + 18, { align: 'center' });

      y += 30;

      const formatRow = (label, value) => [[{ content: label, styles: { fontStyle: 'bold' } }, value]];

      // Info Table
      autoTable(pdf, {
        startY: y,
        theme: 'grid',
        margin: { left: margin },
        tableWidth: pageWidth - margin * 2,
        body: [
          ...formatRow('Employee:', employeeName || 'Unknown'),
          ...formatRow('Jobsite:', jobsiteName || 'Unknown'),
          ...formatRow('Week Starting:', timesheet.week_start_date ? new Date(timesheet.week_start_date).toLocaleDateString() : 'N/A'),
          ...formatRow('Hourly Rate:', `$${Number(timesheet.hourly_rate ?? 0).toFixed(2)}`)
        ],
        styles: { fontSize: 10, cellPadding: 4 },
      });

      y = (pdf).lastAutoTable.finalY + 10;

      // Hours Table
      const tableData = [
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
        head: [['Day', 'Hours']],
        body: tableData.map(([day, hrs]) => [day, Number(hrs).toFixed(2)]),
        theme: 'striped',
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
        margin: { left: margin },
        styles: { fontSize: 10 },
        tableWidth: 90
      });

      y = (pdf).lastAutoTable.finalY + 10;

      // Payroll Breakdown
      if (workerType === 'employee') {
        const total = Number(timesheet.total_hours ?? 0);
        const rate = Number(timesheet.hourly_rate ?? 0);
        const gross = Number(timesheet.gross_pay ?? 0);
        const incomeTaxRate = timesheet.income_tax_rate ? Number(timesheet.income_tax_rate) / 100 : 0.20;
        const cppRate = timesheet.cpp_rate ? Number(timesheet.cpp_rate) / 100 : 0.0595;
        const eiRate = timesheet.ei_rate ? Number(timesheet.ei_rate) / 100 : 0.0235;

        const incomeTax = gross * incomeTaxRate;
        const cpp = gross * cppRate;
        const ei = gross * eiRate;
        const deductions = incomeTax + cpp + ei;
        const net = gross - deductions;

        const breakdownTable = [
          ['Gross Pay', '', `$${gross.toFixed(2)}`],
          ['Federal Income Tax', `${(incomeTaxRate * 100).toFixed(2)}%`, `-$${incomeTax.toFixed(2)}`],
          ['CPP', `${(cppRate * 100).toFixed(2)}%`, `-$${cpp.toFixed(2)}`],
          ['EI', `${(eiRate * 100).toFixed(2)}%`, `-$${ei.toFixed(2)}`],
          ['Total Deductions', '', `-$${deductions.toFixed(2)}`],
          ['Net Pay', '', `$${net.toFixed(2)}`]
        ];

        autoTable(pdf, {
          startY: y,
          head: [['Summary', 'Rate', 'Amount']],
          body: breakdownTable,
          margin: { left: margin },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: 'bold' },
            2: { halign: 'right', fontStyle: 'bold' }
          }
        });

        y = (pdf).lastAutoTable.finalY + 10;
      }

      // Footer
      pdf.setFontSize(9);
      const submittedDate = timesheet.created_at ? new Date(timesheet.created_at).toLocaleDateString() : 'N/A';
      const status = timesheet.status ? timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1) : 'Unknown';
      pdf.text(`Submitted: ${submittedDate}`, margin, y);
      pdf.text(`Status: ${status}`, pageWidth - margin * 5, y);

      const fileName = `timesheet_${(employeeName || 'employee').replace(/\s+/g, '_')}_${new Date(timesheet.week_start_date).toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      throw err;
    }
  };

  return { generateTimesheetPDF };
};

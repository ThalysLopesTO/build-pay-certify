import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const exportDetailedCSV = () => {
    try {
      const rows: string[] = [];
      
      // Add metadata header
      rows.push(`${companyName}`);
      rows.push('Time Summary Report - Detailed Export');
      rows.push(`Period: ${format(dateRange.start, 'MMMM dd, yyyy')} - ${format(dateRange.end, 'MMMM dd, yyyy')}`);
      rows.push(`Generated: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}`);
      
      // Calculate totals for summary
      const totalJobsites = data.length;
      const totalEmployees = new Set(data.flatMap(j => j.employees.map(e => e.employee_name))).size;
      const grandTotal = data.reduce((sum, j) => sum + j.employees.reduce((s, e) => s + e.total_hours, 0), 0);
      
      rows.push(`Total Jobsites: ${totalJobsites} | Total Employees: ${totalEmployees} | Total Hours: ${grandTotal.toFixed(2)}`);
      rows.push(''); // Empty row
      
      // Column headers
      rows.push('Jobsite,Employee Name,Date,Day of Week,Check-In,Check-Out,Hours Worked,Status,Notes');
      
      // Process each jobsite
      data.forEach((jobsite, jobsiteIndex) => {
        rows.push(''); // Separator
        rows.push(`"${jobsite.jobsite_name}"`); // Jobsite header
        
        let jobsiteTotal = 0;
        
        // Process each employee
        jobsite.employees.forEach((employee) => {
          employee.daily_punches.forEach((punch) => {
            const punchDate = punch.date ? new Date(punch.date) : null;
            const dayOfWeek = punchDate ? format(punchDate, 'EEEE') : '';
            const checkIn = punch.check_in_time ? format(new Date(punch.check_in_time), 'hh:mm a') : '--:--';
            const checkOut = punch.check_out_time ? format(new Date(punch.check_out_time), 'hh:mm a') : '--:--';
            
            rows.push(
              `,"${employee.employee_name}",${punchDate ? format(punchDate, 'yyyy-MM-dd') : 'N/A'},${dayOfWeek},${checkIn},${checkOut},${punch.hours_worked.toFixed(2)},${punch.status},`
            );
          });
          
          // Employee subtotal
          rows.push(`,,EMPLOYEE TOTAL:,,,,${employee.total_hours.toFixed(2)},,`);
          rows.push(''); // Empty row after employee
          
          jobsiteTotal += employee.total_hours;
        });
        
        // Jobsite total
        rows.push(`,JOBSITE TOTAL: "${jobsite.jobsite_name}",,,,${jobsiteTotal.toFixed(2)},,`);
      });
      
      // Grand total
      rows.push('');
      rows.push(`,,,GRAND TOTAL:,,,${grandTotal.toFixed(2)},,`);
      
      // Download
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `time-summary-detailed-${format(dateRange.start, 'yyyy-MM-dd')}-to-${format(dateRange.end, 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'CSV Exported',
        description: 'Detailed time summary exported successfully.',
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

  const exportPayrollSummary = () => {
    try {
      const rows: string[] = [];
      
      // Add metadata header
      rows.push(`${companyName}`);
      rows.push('Payroll Summary Report');
      rows.push(`Period: ${format(dateRange.start, 'MMMM dd, yyyy')} - ${format(dateRange.end, 'MMMM dd, yyyy')}`);
      rows.push(`Generated: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}`);
      rows.push(''); // Empty row
      
      // Column headers
      rows.push('Employee Name,Primary Jobsite,Total Hours,Days Worked,Regular Hours (≤8/day),Overtime Hours (>8/day),Average Hours/Day');
      
      // Aggregate employee data across all jobsites
      const employeeMap = new Map<string, {
        name: string;
        jobsite: string;
        totalHours: number;
        daysWorked: number;
        regularHours: number;
        overtimeHours: number;
      }>();
      
      data.forEach((jobsite) => {
        jobsite.employees.forEach((employee) => {
          const existing = employeeMap.get(employee.employee_name);
          
          // Calculate regular vs overtime for this employee
          let regularHours = 0;
          let overtimeHours = 0;
          const daysWorked = employee.daily_punches.length;
          
          employee.daily_punches.forEach((punch) => {
            const hours = punch.hours_worked;
            if (hours <= 8) {
              regularHours += hours;
            } else {
              regularHours += 8;
              overtimeHours += hours - 8;
            }
          });
          
          if (existing) {
            existing.totalHours += employee.total_hours;
            existing.daysWorked += daysWorked;
            existing.regularHours += regularHours;
            existing.overtimeHours += overtimeHours;
          } else {
            employeeMap.set(employee.employee_name, {
              name: employee.employee_name,
              jobsite: jobsite.jobsite_name,
              totalHours: employee.total_hours,
              daysWorked,
              regularHours,
              overtimeHours,
            });
          }
        });
      });
      
      // Sort by employee name
      const employees = Array.from(employeeMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      // Add employee rows
      let totalHours = 0;
      let totalDays = 0;
      let totalRegular = 0;
      let totalOvertime = 0;
      
      employees.forEach((emp) => {
        const avgHours = emp.totalHours / emp.daysWorked;
        rows.push(
          `"${emp.name}","${emp.jobsite}",${emp.totalHours.toFixed(2)},${emp.daysWorked},${emp.regularHours.toFixed(2)},${emp.overtimeHours.toFixed(2)},${avgHours.toFixed(2)}`
        );
        
        totalHours += emp.totalHours;
        totalDays += emp.daysWorked;
        totalRegular += emp.regularHours;
        totalOvertime += emp.overtimeHours;
      });
      
      // Add totals row
      rows.push('');
      const avgTotal = totalDays > 0 ? totalHours / totalDays : 0;
      rows.push(
        `TOTALS:,,${totalHours.toFixed(2)},${totalDays},${totalRegular.toFixed(2)},${totalOvertime.toFixed(2)},${avgTotal.toFixed(2)}`
      );
      
      // Download
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `payroll-summary-${format(dateRange.start, 'yyyy-MM-dd')}-to-${format(dateRange.end, 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Payroll Summary Exported',
        description: 'Payroll summary exported successfully.',
      });
    } catch (error) {
      console.error('Error exporting payroll summary:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export payroll summary. Please try again.',
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={exportDetailedCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Detailed Export
            <span className="ml-auto text-xs text-muted-foreground">All punches</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportPayrollSummary}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Payroll Summary
            <span className="ml-auto text-xs text-muted-foreground">Aggregated</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button onClick={exportToPDF} variant="outline" className="gap-2">
        <FileText className="h-4 w-4" />
        Export PDF
      </Button>
    </div>
  );
};

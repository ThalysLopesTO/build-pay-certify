
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Calendar } from 'lucide-react';
import { useTimesheets } from '@/hooks/useTimesheets';
import { useJobsites } from '@/hooks/useJobsites';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const WeeklyHistorySection = () => {
  const { weeklyTimesheets } = useTimesheets();
  const { data: jobsites } = useJobsites();
  const { toast } = useToast();

  const getJobsiteName = (jobsiteId: string) => {
    const jobsite = jobsites?.find(j => j.id === jobsiteId);
    return jobsite?.name || 'Unknown Jobsite';
  };

  const handleExportPDF = () => {
    toast({
      title: "PDF Export",
      description: "PDF export functionality will be implemented soon.",
    });
  };

  const handleExportCSV = () => {
    if (!weeklyTimesheets || weeklyTimesheets.length === 0) {
      toast({
        title: "No Data",
        description: "No timesheet data available to export.",
        variant: "destructive",
      });
      return;
    }

    const csvHeaders = ['Date', 'Jobsite', 'Clock In', 'Clock Out', 'Total Hours'];
    const csvData = weeklyTimesheets.map(timesheet => [
      format(new Date(timesheet.check_in_time!), 'MM/dd/yyyy'),
      getJobsiteName(timesheet.jobsite_id),
      timesheet.check_in_time ? format(new Date(timesheet.check_in_time), 'h:mm a') : '--',
      timesheet.check_out_time ? format(new Date(timesheet.check_out_time), 'h:mm a') : 'Still Active',
      timesheet.hours_worked ? timesheet.hours_worked.toFixed(2) : '0.00'
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet-week-${format(new Date(), 'MM-dd-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Exported",
      description: "Your timesheet data has been exported successfully.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Weekly History</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <FileText className="h-4 w-4" />
              <span>PDF</span>
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>CSV</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Jobsite</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyTimesheets?.length === 0 || !weeklyTimesheets ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No timesheet entries for this week
                  </TableCell>
                </TableRow>
              ) : (
                weeklyTimesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell className="font-medium">
                      {format(new Date(timesheet.check_in_time!), 'EEE, MMM d')}
                    </TableCell>
                    <TableCell>{getJobsiteName(timesheet.jobsite_id)}</TableCell>
                    <TableCell>
                      {timesheet.check_in_time 
                        ? format(new Date(timesheet.check_in_time), 'h:mm a')
                        : '--'
                      }
                    </TableCell>
                    <TableCell>
                      {timesheet.check_out_time 
                        ? format(new Date(timesheet.check_out_time), 'h:mm a')
                        : <span className="text-green-600 font-medium">Still Active</span>
                      }
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {timesheet.hours_worked ? timesheet.hours_worked.toFixed(2) : '0.00'}h
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyHistorySection;

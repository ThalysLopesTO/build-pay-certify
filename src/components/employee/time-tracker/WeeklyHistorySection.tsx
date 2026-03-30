
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Download, FileText, Calendar, History } from 'lucide-react';
import { useJobsites } from '@/hooks/useJobsites';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Timesheet } from '@/hooks/useTimesheets';

interface WeeklyHistorySectionProps {
  weeklyTimesheets?: Timesheet[];
  selectedWeek: Date;
}

const formatBreak = (minutes: number | null): string => {
  if (!minutes || minutes === 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const WeeklyHistorySection = ({ weeklyTimesheets, selectedWeek }: WeeklyHistorySectionProps) => {
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

    const csvHeaders = ['Date', 'Jobsite', 'Clock In', 'Clock Out', 'Raw Hours', 'Break', 'Paid Hours'];
    const csvData = weeklyTimesheets.map(timesheet => {
      return [
        timesheet.check_in_time ? format(new Date(timesheet.check_in_time), 'MM/dd/yyyy') : '--',
        getJobsiteName(timesheet.jobsite_id),
        timesheet.check_in_time ? format(new Date(timesheet.check_in_time), 'h:mm a') : '--',
        timesheet.check_out_time ? format(new Date(timesheet.check_out_time), 'h:mm a') : 'Still Active',
        timesheet.raw_hours.toFixed(2),
        formatBreak(timesheet.break_minutes),
        timesheet.paid_hours.toFixed(2),
      ];
    });

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet-week-${format(selectedWeek, 'MM-dd-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Exported",
      description: "Your timesheet data has been exported successfully.",
    });
  };

  // Calculate totals
  const totalRaw = weeklyTimesheets?.reduce((sum, t) => sum + t.raw_hours, 0) || 0;
  const totalBreakMin = weeklyTimesheets?.reduce((sum, t) => sum + (t.break_minutes || 0), 0) || 0;
  const totalPaid = weeklyTimesheets?.reduce((sum, t) => sum + t.paid_hours, 0) || 0;

  return (
    <Card className="shadow-xl border-2 border-primary/10 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-primary/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center space-x-3 text-xl font-bold">
            <History className="h-6 w-6 text-indigo-600" />
            <span>Weekly History</span>
          </CardTitle>
          <div className="flex space-x-3">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-200 transition-colors"
            >
              <FileText className="h-4 w-4 text-red-600" />
              <span className="font-medium">PDF</span>
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 hover:bg-green-50 hover:border-green-200 transition-colors"
            >
              <Download className="h-4 w-4 text-green-600" />
              <span className="font-medium">CSV</span>
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 border-b-2 border-slate-200">
                <TableHead className="font-bold text-slate-700 py-4">Date</TableHead>
                <TableHead className="font-bold text-slate-700 py-4">Jobsite</TableHead>
                <TableHead className="font-bold text-slate-700 py-4">Clock In</TableHead>
                <TableHead className="font-bold text-slate-700 py-4">Clock Out</TableHead>
                <TableHead className="text-right font-bold text-slate-700 py-4">Raw Hours</TableHead>
                <TableHead className="text-right font-bold text-slate-700 py-4">Break</TableHead>
                <TableHead className="text-right font-bold text-slate-700 py-4">Paid Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyTimesheets?.length === 0 || !weeklyTimesheets ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-3 text-muted-foreground">
                      <Calendar className="h-12 w-12 text-slate-300" />
                      <span className="text-lg font-medium">No timesheet entries for this week</span>
                      <span className="text-sm">Get started by clocking in above!</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                weeklyTimesheets.map((timesheet, index) => (
                  <TableRow 
                    key={timesheet.id} 
                    className={`
                      ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} 
                      hover:bg-blue-50/50 transition-colors duration-200 border-b border-slate-100
                    `}
                  >
                    <TableCell className="font-semibold py-4 text-slate-700">
                      {timesheet.check_in_time ? format(new Date(timesheet.check_in_time), 'EEE, MMM d') : '--'}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {getJobsiteName(timesheet.jobsite_id)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 font-mono text-green-700 font-medium">
                      {timesheet.check_in_time 
                        ? format(new Date(timesheet.check_in_time), 'h:mm a')
                        : '--'
                      }
                    </TableCell>
                    <TableCell className="py-4">
                      {timesheet.check_out_time 
                        ? <span className="font-mono text-red-700 font-medium">{format(new Date(timesheet.check_out_time), 'h:mm a')}</span>
                        : <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full animate-pulse">Still Active</span>
                      }
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <span className="font-mono font-bold text-slate-600">
                        {timesheet.raw_hours.toFixed(2)}h
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <span className="font-mono text-orange-700 font-medium">
                        {formatBreak(timesheet.break_minutes)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <span className="font-mono text-lg font-bold text-slate-800">
                        {timesheet.paid_hours.toFixed(2)}h
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {weeklyTimesheets && weeklyTimesheets.length > 0 && (
              <TableFooter>
                <TableRow className="bg-gradient-to-r from-slate-100 to-blue-50 border-t-2 border-slate-300">
                  <TableCell colSpan={4} className="font-bold text-slate-800 py-4 text-right">
                    Week Totals:
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <span className="font-mono font-bold text-slate-700">{totalRaw.toFixed(2)}h</span>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <span className="font-mono font-bold text-orange-700">{formatBreak(totalBreakMin)}</span>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <span className="font-mono text-lg font-black text-slate-900">{totalPaid.toFixed(2)}h</span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyHistorySection;

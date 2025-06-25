
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Calendar as CalendarIcon, Filter, Search, Eye, AlertTriangle, FileText, RefreshCw } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useForemanAttentionReports } from '@/hooks/useAttentionReports';
import { useJobsites } from '@/hooks/useJobsites';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { AttentionReport } from '@/hooks/useAttentionReports';

const EmployeeReports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobsite, setSelectedJobsite] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedReport, setSelectedReport] = useState<AttentionReport | null>(null);

  const { data: reports = [], isLoading, error, refetch } = useForemanAttentionReports();
  const { data: jobsites = [] } = useJobsites();
  const { data: employees = [] } = useEmployeeDirectory();

  console.log('Employee Reports - Reports:', reports);
  console.log('Employee Reports - Loading:', isLoading);
  console.log('Employee Reports - Error:', error);

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${report.user_profiles?.first_name || ''} ${report.user_profiles?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJobsite = selectedJobsite === 'all' || report.jobsite_id === selectedJobsite;
    const matchesEmployee = selectedEmployee === 'all' || report.submitted_by === selectedEmployee;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    let matchesDateRange = true;
    if (dateRange.from && dateRange.to) {
      const reportDate = parseISO(report.created_at);
      matchesDateRange = isWithinInterval(reportDate, { start: dateRange.from, end: dateRange.to });
    }

    return matchesSearch && matchesJobsite && matchesEmployee && matchesStatus && matchesDateRange;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'destructive';
      case 'reviewed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading employee reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2 text-red-600">Error Loading Reports</p>
            <p className="text-gray-500 mb-4">
              {error instanceof Error ? error.message : 'Unable to load attention reports. Please try refreshing the page.'}
            </p>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Employee Reports</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
          </Badge>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedJobsite} onValueChange={setSelectedJobsite}>
              <SelectTrigger>
                <SelectValue placeholder="Select jobsite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobsites</SelectItem>
                {jobsites.map((jobsite) => (
                  <SelectItem key={jobsite.id} value={jobsite.id}>
                    {jobsite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.user_id} value={employee.user_id}>
                    {employee.first_name} {employee.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} -{" "}
                        {format(dateRange.to, "LLL dd")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange(range || {})}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {(searchTerm || selectedJobsite !== 'all' || selectedEmployee !== 'all' || statusFilter !== 'all' || dateRange.from) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedJobsite('all');
                  setSelectedEmployee('all');
                  setStatusFilter('all');
                  setDateRange({});
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No Reports Found</p>
                <p className="text-gray-500">
                  {reports.length === 0 
                    ? "No attention reports have been submitted by employees yet."
                    : "No reports match your current filters. Try adjusting the search criteria."
                  }
                </p>
                {reports.length === 0 && (
                  <p className="text-sm text-gray-400 mt-2">
                    Employees can submit reports using the "Report Issue" tab in their dashboard.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusBadgeVariant(report.status)}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {format(parseISO(report.created_at), 'MMM dd, yyyy at h:mm a')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Employee</p>
                        <p className="text-sm text-gray-600">
                          {report.user_profiles?.first_name} {report.user_profiles?.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Jobsite</p>
                        <p className="text-sm text-gray-600">
                          {report.jobsites?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Report Date</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(report.report_date), 'MMM dd, yyyy')} at {report.report_time}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900">Message Preview</p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {report.message}
                      </p>
                    </div>

                    {report.attachments && report.attachments.length > 0 && (
                      <div className="text-sm text-gray-500">
                        📎 {report.attachments.length} attachment{report.attachments.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReport(report)}
                    className="ml-4"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Report Detail Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              Attention Report Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">Employee</label>
                  <p className="text-sm text-gray-600">
                    {selectedReport.user_profiles?.first_name} {selectedReport.user_profiles?.last_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedReport.status)}>
                      {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Jobsite</label>
                  <p className="text-sm text-gray-600">
                    {selectedReport.jobsites?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Report Date & Time</label>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedReport.report_date), 'MMM dd, yyyy')} at {selectedReport.report_time}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Submitted</label>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(selectedReport.created_at), 'MMM dd, yyyy at h:mm a')}
                  </p>
                </div>
                {selectedReport.reviewed_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-900">Reviewed</label>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(selectedReport.reviewed_at), 'MMM dd, yyyy at h:mm a')}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900">Message</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {selectedReport.message}
                  </p>
                </div>
              </div>

              {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-900">Attachments</label>
                  <div className="mt-2 space-y-2">
                    {selectedReport.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{attachment.file_name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(attachment.file_url, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeReports;

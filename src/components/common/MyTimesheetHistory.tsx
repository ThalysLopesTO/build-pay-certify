import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Clock, DollarSign, MapPin, Search, Filter, Calendar } from 'lucide-react';
import { useMyTimesheetHistory, type TimesheetHistoryEntry } from '@/hooks/useMyTimesheetHistory';

const MyTimesheetHistory = () => {
  const { data: timesheets = [], isLoading } = useMyTimesheetHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetHistoryEntry | null>(null);

  const filteredTimesheets = timesheets.filter(timesheet => {
    const matchesSearch = timesheet.jobsite_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || timesheet.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading your timesheet history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Clock className="h-6 w-6" />
        <h2 className="text-2xl font-bold">My Timesheet History</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by jobsite..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTimesheets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'No timesheets match your filters.' 
                : 'You haven\'t submitted any timesheets yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTimesheets.map((timesheet) => (
            <Card key={timesheet.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {formatDateRange(timesheet.week_start_date, timesheet.week_end_date)}
                  </CardTitle>
                  <Badge variant={getStatusVariant(timesheet.status)}>
                    {timesheet.status}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {timesheet.jobsite_name}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="font-semibold">{timesheet.total_hours.toFixed(1)}h</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Pay</p>
                      <p className="font-semibold">{formatCurrency(timesheet.gross_pay)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Hourly Rate</p>
                    <p className="font-semibold">{formatCurrency(timesheet.hourly_rate)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Worker Type</p>
                    <p className="font-semibold capitalize">{timesheet.worker_type}</p>
                  </div>
                </div>

                {timesheet.biWeeklyData && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Bi-Weekly Breakdown:</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Week 1: </span>
                        <span className="font-medium">
                          {(timesheet.biWeeklyData.week1?.totalHours || 0).toFixed(1)}h
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Week 2: </span>
                        <span className="font-medium">
                          {(timesheet.biWeeklyData.week2?.totalHours || 0).toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-3 border-t text-xs text-muted-foreground">
                  <span>
                    Submitted: {format(new Date(timesheet.submitted_at), 'PPP')}
                  </span>
                  {timesheet.reviewed_at && (
                    <span>
                      Reviewed: {format(new Date(timesheet.reviewed_at), 'PPP')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTimesheetHistory;
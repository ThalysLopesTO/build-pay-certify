import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Search, Filter, Calendar, RefreshCw } from 'lucide-react';
import { useMyTimesheetHistory } from '@/hooks/useMyTimesheetHistory';
import { useIsMobile } from '@/hooks/use-mobile';
import TimesheetCollapsibleItem from './TimesheetCollapsibleItem';

const MyTimesheetHistory = () => {
  const { data: timesheets = [], isLoading } = useMyTimesheetHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const isMobile = useIsMobile();

  const filteredTimesheets = timesheets.filter(timesheet => {
    const matchesSearch = timesheet.jobsite_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = statusFilter === 'all' || timesheet.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalHours = filteredTimesheets.reduce((sum, ts) => sum + ts.total_hours, 0);
  const totalGrossPay = filteredTimesheets.reduce((sum, ts) => sum + ts.gross_pay, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading your timesheet history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary Stats */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-6 w-6 text-primary" />
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>My Timesheet History</h2>
        </div>
        
        {filteredTimesheets.length > 0 && (
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{filteredTimesheets.length}</p>
                <p className="text-sm text-muted-foreground">Timesheets</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{totalHours.toFixed(1)}h</p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
            </Card>
            {!isMobile && (
              <>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(totalGrossPay)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Gross Pay</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {totalHours > 0 ? (totalGrossPay / totalHours).toFixed(2) : '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg. Rate/Hour</p>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
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
          <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'}`}>
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

      {/* Results */}
      {filteredTimesheets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'No timesheets match your filters' 
                : 'No timesheets yet'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters to find what you\'re looking for.' 
                : 'Your submitted timesheets will appear here once you\'ve clocked time at jobsites.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTimesheets.map((timesheet) => (
            <TimesheetCollapsibleItem key={timesheet.id} timesheet={timesheet} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTimesheetHistory;
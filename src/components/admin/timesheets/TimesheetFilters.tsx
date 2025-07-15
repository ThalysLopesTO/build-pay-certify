
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { useWorkWeek } from '@/hooks/useWorkWeek';
import { useJobsites } from '@/hooks/useJobsites';

interface TimesheetFiltersProps {
  filters: {
    employeeName: string;
    weekEndingDate: string;
    status: string;
    jobsiteId: string;
  };
  onFiltersChange: (filters: any) => void;
  employees: any[];
  timesheets?: any[]; // Add timesheets to extract guest entries
}

const TimesheetFilters: React.FC<TimesheetFiltersProps> = ({
  filters,
  onFiltersChange,
  employees,
  timesheets = []
}) => {
  // Get work weeks based on company settings
  const workWeeks = useWorkWeek();
  
  // Get jobsites for the filter
  const { data: jobsites = [] } = useJobsites();

  const handleEmployeeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      employeeName: value === 'all' ? '' : value
    });
  };

  const handleWeekChange = (value: string) => {
    onFiltersChange({
      ...filters,
      weekEndingDate: value === 'all' ? '' : value
    });
  };

  const handleJobsiteChange = (value: string) => {
    onFiltersChange({
      ...filters,
      jobsiteId: value === 'all' ? '' : value
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      employeeName: '',
      weekEndingDate: '',
      status: 'all',
      jobsiteId: ''
    });
  };

  const hasActiveFilters = filters.employeeName || filters.weekEndingDate || filters.status !== 'all' || filters.jobsiteId;

  // Filter employees with valid names and create display names
  const validEmployees = employees?.filter(employee => {
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    return fullName.length > 0;
  }).map(employee => ({
    ...employee,
    displayName: `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
    type: 'employee'
  })) || [];

  // Extract unique guest entries from timesheets
  const guestEntries = timesheets
    .filter(timesheet => timesheet.is_manual_entry && timesheet.manual_entry_name)
    .reduce((acc, timesheet) => {
      const name = timesheet.manual_entry_name;
      if (!acc.some(entry => entry.displayName === name)) {
        acc.push({
          id: `guest-${name}`,
          displayName: name,
          type: 'guest'
        });
      }
      return acc;
    }, [] as any[]);

  // Combine employees and guest entries
  const allEntries = [...validEmployees, ...guestEntries];

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="week-filter" className="text-sm text-gray-600">Week:</Label>
            <Select value={filters.weekEndingDate || 'all'} onValueChange={handleWeekChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All weeks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All weeks</SelectItem>
                {workWeeks?.availableWeeks.map((week) => (
                  <SelectItem key={week.weekStartDateString} value={week.weekStartDateString}>
                    {week.rangeFormatted}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="employee-filter" className="text-sm text-gray-600">Employee:</Label>
            <Select value={filters.employeeName || 'all'} onValueChange={handleEmployeeChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                {validEmployees.length > 0 && (
                  <>
                    {validEmployees.map((employee) => (
                      <SelectItem 
                        key={employee.id} 
                        value={employee.displayName}
                      >
                        {employee.displayName}
                      </SelectItem>
                    ))}
                  </>
                )}
                {guestEntries.length > 0 && (
                  <>
                    <SelectItem disabled value="guest-divider">
                      ─── Guest Entries ───
                    </SelectItem>
                    {guestEntries.map((entry) => (
                      <SelectItem 
                        key={entry.id} 
                        value={entry.displayName}
                      >
                        {entry.displayName} (Guest)
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="jobsite-filter" className="text-sm text-gray-600">Jobsite:</Label>
            <Select value={filters.jobsiteId || 'all'} onValueChange={handleJobsiteChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All jobsites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All jobsites</SelectItem>
                {jobsites.map((jobsite) => (
                  <SelectItem key={jobsite.id} value={jobsite.id}>
                    {jobsite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="text-sm text-gray-600">Status:</Label>
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimesheetFilters;

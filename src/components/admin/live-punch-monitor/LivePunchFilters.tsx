
import React from 'react';
import { Button } from '@/components/ui/button';
import { BadgeWithDot } from '@/components/base/badges/badges';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Building, Users, Activity, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/hooks/new/useUsers';

interface LivePunchFiltersProps {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  selectedJobsite: string;
  setSelectedJobsite: (jobsite: string) => void;
  selectedEmployee: string;
  setSelectedEmployee: (employee: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  jobsites?: Array<{ id: string; name: string }>;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const LivePunchFilters: React.FC<LivePunchFiltersProps> = ({
  selectedDate,
  setSelectedDate,
  selectedJobsite,
  setSelectedJobsite,
  selectedEmployee,
  setSelectedEmployee,
  statusFilter,
  setStatusFilter,
  jobsites,
  onClearFilters,
  hasActiveFilters,
}) => {
  const { data } = useEmployees();
  const employees = data?.activeEmployees ?? [];

  const selectedEmployeeObj = employees?.find((e) => e.user_id === selectedEmployee);
  const selectedJobsiteObj = jobsites?.find((j) => j.id === selectedJobsite);

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold text-foreground">Filter Controls</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-full justify-start gap-2 font-normal"
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {selectedDate ? format(selectedDate, 'PPP') : 'All Dates'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="border-b p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(null)}
                className="w-full justify-start text-xs"
              >
                Show all dates
              </Button>
            </div>
            <CalendarComponent
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => setSelectedDate(date || null)}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>

        {/* Jobsite Filter */}
        <Select value={selectedJobsite} onValueChange={setSelectedJobsite}>
          <SelectTrigger className="h-10 gap-2">
            <Building className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <SelectValue placeholder="All Jobsites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobsites</SelectItem>
            {jobsites?.map((jobsite) => (
              <SelectItem key={jobsite.id} value={jobsite.id}>
                {jobsite.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Employee Filter */}
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="h-10 gap-2">
            <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees?.map((employee) => (
              <SelectItem key={employee.user_id} value={employee.user_id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 gap-2">
            <Activity className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Clocked In</SelectItem>
            <SelectItem value="completed">Clocked Out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {(selectedJobsite !== 'all' ||
        selectedEmployee !== 'all' ||
        statusFilter !== 'all' ||
        selectedDate) && (
        <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">Active:</span>

          {selectedDate && (
            <BadgeWithDot color="brand" size="sm">
              <span className="inline-flex items-center gap-1">
                {format(selectedDate, 'MMM dd, yyyy')}
                <button
                  onClick={() => setSelectedDate(null)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                  aria-label="Remove date filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </BadgeWithDot>
          )}

          {selectedJobsite !== 'all' && (
            <BadgeWithDot color="blue" size="sm">
              <span className="inline-flex items-center gap-1">
                {selectedJobsiteObj?.name}
                <button
                  onClick={() => setSelectedJobsite('all')}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                  aria-label="Remove jobsite filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </BadgeWithDot>
          )}

          {selectedEmployee !== 'all' && (
            <BadgeWithDot color="indigo" size="sm">
              <span className="inline-flex items-center gap-1">
                {selectedEmployeeObj?.first_name} {selectedEmployeeObj?.last_name}
                <button
                  onClick={() => setSelectedEmployee('all')}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                  aria-label="Remove employee filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </BadgeWithDot>
          )}

          {statusFilter !== 'all' && (
            <BadgeWithDot
              color={statusFilter === 'active' ? 'success' : 'gray'}
              size="sm"
            >
              <span className="inline-flex items-center gap-1">
                {statusFilter === 'active' ? 'Clocked In' : 'Clocked Out'}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                  aria-label="Remove status filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </BadgeWithDot>
          )}
        </div>
      )}
    </div>
  );
};

export default LivePunchFilters;


import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Calendar as CalendarIcon, Building, Users, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  employees?: Array<{ user_id: string; first_name: string; last_name: string }>;
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
  employees,
  onClearFilters,
  hasActiveFilters
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary"></div>
          <h3 className="text-lg font-semibold text-foreground">Filter Controls</h3>
        </div>
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="text-xs"
          >
            Clear All Filters
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Date Filter
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal hover:bg-accent/50 border-accent/30"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "All Dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-2 border-b">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedDate(null)}
                  className="w-full text-left justify-start text-xs"
                >
                  Show All Dates
                </Button>
              </div>
              <CalendarComponent
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date) => setSelectedDate(date || null)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Jobsite Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            Jobsite
          </label>
          <Select value={selectedJobsite} onValueChange={setSelectedJobsite}>
            <SelectTrigger className="hover:bg-accent/50 border-accent/30">
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
        </div>

        {/* Employee Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Employee
          </label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="hover:bg-accent/50 border-accent/30">
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
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Status
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="hover:bg-accent/50 border-accent/30">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Clocked In</SelectItem>
              <SelectItem value="completed">Clocked Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-2">
        {selectedJobsite !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            Jobsite: {jobsites?.find(j => j.id === selectedJobsite)?.name}
            <button 
              onClick={() => setSelectedJobsite('all')}
              className="ml-1 hover:bg-destructive/20 rounded-full"
            >
              ×
            </button>
          </Badge>
        )}
        {selectedEmployee !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            Employee: {employees?.find(e => e.user_id === selectedEmployee)?.first_name} {employees?.find(e => e.user_id === selectedEmployee)?.last_name}
            <button 
              onClick={() => setSelectedEmployee('all')}
              className="ml-1 hover:bg-destructive/20 rounded-full"
            >
              ×
            </button>
          </Badge>
        )}
        {statusFilter !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            Status: {statusFilter === 'active' ? 'Clocked In' : 'Clocked Out'}
            <button 
              onClick={() => setStatusFilter('all')}
              className="ml-1 hover:bg-destructive/20 rounded-full"
            >
              ×
            </button>
          </Badge>
        )}
        {selectedDate && (
          <Badge variant="secondary" className="gap-1">
            Date: {format(selectedDate, "MMM dd, yyyy")}
            <button 
              onClick={() => setSelectedDate(null)}
              className="ml-1 hover:bg-destructive/20 rounded-full"
            >
              ×
            </button>
          </Badge>
        )}
        {!selectedDate && (selectedEmployee !== 'all' || selectedJobsite !== 'all' || statusFilter !== 'all') && (
          <Badge variant="outline" className="gap-1">
            All Dates
          </Badge>
        )}
      </div>
    </div>
  );
};

export default LivePunchFilters;

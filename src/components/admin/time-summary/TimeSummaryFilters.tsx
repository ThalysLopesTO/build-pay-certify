import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Filter, X, Building, Users } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { TimeSummaryFilters as Filters } from '@/hooks/useTimeSummaryData';

interface TimeSummaryFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export const TimeSummaryFilters: React.FC<TimeSummaryFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const { user } = useAuth();
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  // Fetch jobsites
  const { data: jobsites = [] } = useQuery({
    queryKey: ['jobsites', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const { data, error } = await supabase
        .from('jobsites')
        .select('id, name')
        .eq('company_id', user.companyId)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.companyId,
  });

  // Fetch employees - using consistent query key with useEmployeeDirectory
  const { data: employees = [], isLoading: isLoadingEmployees, error: employeesError } = useQuery({
    queryKey: ['employee-directory', user?.companyId],
    queryFn: async () => {
      console.log('[TimeSummaryFilters] Fetching employees for company:', user?.companyId);
      
      if (!user?.companyId) {
        console.log('[TimeSummaryFilters] No company ID available');
        return [];
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .eq('company_id', user.companyId)
        .eq('is_active', true)
        .in('role', ['employee', 'foreman', 'admin', 'management'])
        .order('first_name');
      
      if (error) {
        console.error('[TimeSummaryFilters] Error fetching employees:', error);
        throw error;
      }
      
      const formattedData = data?.map(e => ({
        id: e.user_id,
        name: `${e.first_name} ${e.last_name}`
      })) || [];
      
      console.log('[TimeSummaryFilters] Employees loaded:', formattedData.length, 'employees');
      return formattedData;
    },
    enabled: !!user?.companyId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    retry: 3,
  });

  const handleDateRangePreset = (preset: string) => {
    const now = new Date();
    let start: Date, end: Date;

    switch (preset) {
      case 'this-week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'last-week':
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start = startOfWeek(lastWeek, { weekStartsOn: 1 });
        end = endOfWeek(lastWeek, { weekStartsOn: 1 });
        break;
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default:
        return;
    }

    onFiltersChange({
      ...filters,
      dateRange: { start, end }
    });
  };

  const handleJobsiteToggle = (jobsiteId: string) => {
    const newJobsiteIds = filters.jobsiteIds.includes(jobsiteId)
      ? filters.jobsiteIds.filter(id => id !== jobsiteId)
      : [...filters.jobsiteIds, jobsiteId];
    
    onFiltersChange({
      ...filters,
      jobsiteIds: newJobsiteIds
    });
  };

  const handleEmployeeToggle = (employeeId: string) => {
    const newEmployeeIds = filters.employeeIds.includes(employeeId)
      ? filters.employeeIds.filter(id => id !== employeeId)
      : [...filters.employeeIds, employeeId];
    
    onFiltersChange({
      ...filters,
      employeeIds: newEmployeeIds
    });
  };

  const handleClearFilters = () => {
    const now = new Date();
    onFiltersChange({
      dateRange: {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 })
      },
      jobsiteIds: [],
      employeeIds: [],
      status: 'all'
    });
  };

  return (
    <Card className="overflow-hidden shadow-md">
      <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-4 md:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Filters</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Customize your time summary view</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground self-start sm:self-auto min-h-[44px]"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Date Range
            </Label>
            <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal min-h-[44px] hover:bg-accent/50 transition-colors",
                    !filters.dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">
                    {filters.dateRange ? (
                      <>
                        {format(filters.dateRange.start, "MMM dd")} - {format(filters.dateRange.end, "MMM dd, yyyy")}
                      </>
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background shadow-lg" align="start">
                <div className="p-3 border-b">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleDateRangePreset('this-week');
                        setDateRangeOpen(false);
                      }}
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      This Week
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleDateRangePreset('last-week');
                        setDateRangeOpen(false);
                      }}
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      Last Week
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleDateRangePreset('this-month');
                        setDateRangeOpen(false);
                      }}
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      This Month
                    </Button>
                  </div>
                </div>
                <Calendar
                  mode="range"
                  selected={{
                    from: filters.dateRange.start,
                    to: filters.dateRange.end
                  }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      onFiltersChange({
                        ...filters,
                        dateRange: { start: range.from, end: range.to }
                      });
                      setDateRangeOpen(false);
                    }
                  }}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Jobsite Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building className="h-4 w-4 text-primary" />
              Jobsites
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start min-h-[44px] hover:bg-accent/50 transition-colors"
                >
                  <Building className="mr-2 h-4 w-4" />
                  {filters.jobsiteIds.length === 0 ? 'All Jobsites' : `${filters.jobsiteIds.length} selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 bg-background shadow-lg" align="start">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {Array.isArray(jobsites) && jobsites.length > 0 ? (
                    jobsites.map((jobsite) => (
                      <div key={jobsite.id} className="flex items-center space-x-2 p-2 rounded hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={`jobsite-${jobsite.id}`}
                          checked={filters.jobsiteIds.includes(jobsite.id)}
                          onCheckedChange={() => handleJobsiteToggle(jobsite.id)}
                        />
                        <label
                          htmlFor={`jobsite-${jobsite.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {jobsite.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No jobsites found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Employee Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Employees
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start min-h-[44px] hover:bg-accent/50 transition-colors"
                >
                  <Users className="mr-2 h-4 w-4" />
                  {filters.employeeIds.length === 0 ? 'All Employees' : `${filters.employeeIds.length} selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 bg-background shadow-lg" align="start">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {isLoadingEmployees ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Loading employees...
                    </div>
                  ) : employeesError ? (
                    <div className="text-sm text-destructive text-center py-4">
                      Error loading employees
                    </div>
                  ) : Array.isArray(employees) && employees.length > 0 ? (
                    employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2 p-2 rounded hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={filters.employeeIds.includes(employee.id)}
                          onCheckedChange={() => handleEmployeeToggle(employee.id)}
                        />
                        <label
                          htmlFor={`employee-${employee.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {employee.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No employees found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Filter className="h-4 w-4 text-primary" />
              Status
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value: any) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger className="min-h-[44px] hover:bg-accent/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Punches</SelectItem>
                <SelectItem value="complete">Complete Only</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
};

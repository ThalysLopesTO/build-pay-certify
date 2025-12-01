import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X, Building, Users, ChevronDown } from 'lucide-react';
import { startOfWeek, endOfWeek } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { TimeSummaryFilters as Filters } from '@/hooks/useTimeSummaryData';
import { DateRangeSelector } from './DateRangeSelector';
import { Badge } from '@/components/ui/badge';

interface TimeSummaryFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export const TimeSummaryFilters: React.FC<TimeSummaryFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const { user } = useAuth();

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
    refetchOnWindowFocus: false,
    retry: 3,
  });


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

  // Count active filters
  const activeFiltersCount = [
    filters.jobsiteIds.length > 0,
    filters.employeeIds.length > 0,
    filters.status !== 'all'
  ].filter(Boolean).length;

  return (
    <Card className="overflow-hidden shadow-lg border-border/50">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 md:p-5 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15 shadow-sm">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Filters</h2>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-2 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Customize your time summary view</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 self-start sm:self-auto min-h-[44px] transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Date Range
            </Label>
            <DateRangeSelector
              value={filters.dateRange}
              onChange={(range) => onFiltersChange({ ...filters, dateRange: range })}
            />
          </div>

          {/* Jobsite Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Jobsites
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between min-h-[44px] hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {filters.jobsiteIds.length === 0 ? 'All Jobsites' : `${filters.jobsiteIds.length} selected`}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 bg-background shadow-xl border" align="start">
                <div className="p-3 border-b bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select Jobsites</p>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {Array.isArray(jobsites) && jobsites.length > 0 ? (
                    jobsites.map((jobsite) => (
                      <div key={jobsite.id} className="flex items-center space-x-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                        <Checkbox
                          id={`jobsite-${jobsite.id}`}
                          checked={filters.jobsiteIds.includes(jobsite.id)}
                          onCheckedChange={() => handleJobsiteToggle(jobsite.id)}
                        />
                        <label
                          htmlFor={`jobsite-${jobsite.id}`}
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                        >
                          {jobsite.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No jobsites found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Employee Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Employees
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between min-h-[44px] hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {filters.employeeIds.length === 0 ? 'All Employees' : `${filters.employeeIds.length} selected`}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 bg-background shadow-xl border" align="start">
                <div className="p-3 border-b bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select Employees</p>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {isLoadingEmployees ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      Loading employees...
                    </div>
                  ) : employeesError ? (
                    <div className="text-sm text-destructive text-center py-8">
                      Error loading employees
                    </div>
                  ) : Array.isArray(employees) && employees.length > 0 ? (
                    employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={filters.employeeIds.includes(employee.id)}
                          onCheckedChange={() => handleEmployeeToggle(employee.id)}
                        />
                        <label
                          htmlFor={`employee-${employee.id}`}
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                        >
                          {employee.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No employees found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
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

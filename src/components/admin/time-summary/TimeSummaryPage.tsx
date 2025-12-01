import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, RefreshCw, X, Calendar, Building, Users, Filter as FilterIcon, Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';
import { TimeSummaryFilters } from './TimeSummaryFilters';
import { TimeSummaryTable } from './TimeSummaryTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTimeSummaryDataWithRules } from '@/hooks/useTimeSummaryDataWithRules';
import { useTimeSummaryExport } from '@/hooks/useTimeSummaryExport';
import { TimeSummaryFilters as Filters } from '@/hooks/useTimeSummaryData';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from '@/contexts/RealtimeProvider';

export const TimeSummaryPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { subscribe } = useRealtime();
  const now = new Date();

  const [filters, setFilters] = useState<Filters>({
    dateRange: {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 })
    },
    jobsiteIds: [],
    employeeIds: [],
    status: 'all'
  });

  // Track recent filter changes to prevent real-time race conditions
  const recentFilterChangeRef = useRef(false);
  
  // Track current filters for use in real-time callback
  const currentFiltersRef = useRef(filters);

  // Keep currentFiltersRef in sync with filters
  useEffect(() => {
    currentFiltersRef.current = filters;
  }, [filters]);

  // Clear any stale cache on mount to ensure fresh data
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ['time-summary'], exact: false });
    queryClient.removeQueries({ queryKey: ['timeSummaryDetails'], exact: false });
  }, []); // Only on mount

  // Set grace period after filter changes
  useEffect(() => {
    recentFilterChangeRef.current = true;
    const timeout = setTimeout(() => { recentFilterChangeRef.current = false; }, 2000); // 2 second grace period
    return () => clearTimeout(timeout);
  }, [filters.jobsiteIds, filters.employeeIds, filters.dateRange, filters.status]);

  // Fetch company settings for branding
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return null;
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_name, company_logo_url')
        .eq('company_id', user.companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId,
  });

  const { data, isLoading } = useTimeSummaryDataWithRules(filters);

  // Initialize export hook
  const { isExporting, exportPayrollCSV, exportPayrollPDF } = useTimeSummaryExport({
    companyId: user?.companyId || '',
    companyName: companySettings?.company_name || 'Company',
    companyLogo: companySettings?.company_logo_url,
    dateRange: filters.dateRange,
    jobsiteFilter: filters.jobsiteIds,
    employeeFilter: filters.employeeIds,
    data: data || [],
  });

  // Set up real-time subscription for timesheet changes
  useEffect(() => {
    if (!user?.companyId) return;

    console.log('[Time Summary] Setting up real-time subscription for company:', user.companyId);
    
    const unsubscribe = subscribe(
      'time-summary-realtime',
      {
        event: '*',
        schema: 'public',
        table: 'timesheets',
        filter: `company_id=eq.${user.companyId}`,
      },
      (payload) => {
        console.log('[Time Summary] Real-time event received:', {
          eventType: payload.eventType,
          timestamp: new Date().toISOString(),
          oldData: payload.old,
          newData: payload.new
        });
        
        // Skip invalidation if user just changed filters (prevent race condition)
        if (recentFilterChangeRef.current) {
          console.log('[Time Summary] Skipping real-time invalidation - recent filter change');
          return;
        }
        
        // Use exact query key invalidation to prevent stale unfiltered data from being refetched
        const currentFilters = currentFiltersRef.current;
        const startDateStr = format(currentFilters.dateRange.start, 'yyyy-MM-dd');
        const endDateStr = format(currentFilters.dateRange.end, 'yyyy-MM-dd');
        
        console.log('[Time Summary] Invalidating exact query with filters:', {
          startDate: startDateStr,
          endDate: endDateStr,
          jobsiteIds: currentFilters.jobsiteIds,
          employeeIds: currentFilters.employeeIds,
          status: currentFilters.status
        });
        
        // Invalidate ONLY the exact current query - not all time-summary queries
        queryClient.invalidateQueries({ 
          queryKey: [
            'time-summary',
            user.companyId,
            startDateStr,
            endDateStr,
            currentFilters.jobsiteIds,
            currentFilters.employeeIds,
            currentFilters.status
          ]
        });
        
        // Also invalidate the raw timesheets query with same filters
        queryClient.invalidateQueries({
          queryKey: [
            'time-summary-raw-timesheets',
            user.companyId,
            currentFilters.dateRange.start.toISOString(),
            currentFilters.dateRange.end.toISOString(),
            currentFilters.jobsiteIds,
            currentFilters.employeeIds,
          ]
        });
      },
      { companyId: user.companyId }
    );

    return () => {
      console.log('[Time Summary] Cleaning up real-time subscription');
      unsubscribe.then(unsub => unsub?.());
    };
  }, [user?.companyId, subscribe]); // queryClient is stable, no need in deps

  const handleManualRefresh = async () => {
    console.log('[Time Summary] Manual refresh triggered');
    
    // Cancel any in-flight queries first to abort ongoing requests
    await queryClient.cancelQueries({ queryKey: ['time-summary'] });
    await queryClient.cancelQueries({ queryKey: ['timeSummaryDetails'] });
    
    // Remove all inactive/stale queries to prevent race conditions
    queryClient.removeQueries({ 
      queryKey: ['time-summary'],
      type: 'inactive'
    });
    queryClient.removeQueries({ 
      queryKey: ['timeSummaryDetails'],
      type: 'inactive'
    });
    
    // Invalidate only the current query (will auto-refetch because it's active)
    queryClient.invalidateQueries({ 
      queryKey: ['time-summary', user?.companyId],
      exact: false
    });
  };

  // Count active filters
  const activeFilterCount = [
    filters.jobsiteIds && filters.jobsiteIds.length > 0,
    filters.employeeIds && filters.employeeIds.length > 0,
    filters.status !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 md:space-y-6 pb-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Time Summary</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              View aggregated timesheet data for payroll processing
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/admin/dashboard?tab=timesheets'}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View raw punches →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="min-h-[44px]"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} md:mr-2`} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                disabled={isLoading || isExporting || !data || data.length === 0}
                className="min-h-[44px]"
              >
                <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''} md:mr-2`} />
                <span className="hidden md:inline">
                  {isExporting ? 'Exporting...' : 'Download Report'}
                </span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={exportPayrollCSV} disabled={isExporting}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPayrollPDF} disabled={isExporting}>
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FilterIcon className="h-4 w-4" />
              <span className="font-medium">Active Filters:</span>
            </div>
            
            {/* Date Range Badge */}
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {format(filters.dateRange.start, 'MMM dd')} - {format(filters.dateRange.end, 'MMM dd, yyyy')}
            </Badge>

            {/* Jobsite Filters */}
            {filters.jobsiteIds && filters.jobsiteIds.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Building className="h-3 w-3" />
                {filters.jobsiteIds.length} {filters.jobsiteIds.length === 1 ? 'Project' : 'Projects'}
              </Badge>
            )}

            {/* Employee Filters */}
            {filters.employeeIds && filters.employeeIds.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {filters.employeeIds.length} {filters.employeeIds.length === 1 ? 'Employee' : 'Employees'}
              </Badge>
            )}

            {/* Status Filter */}
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="capitalize">
                {filters.status}
              </Badge>
            )}

            {/* Clear All Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({
                dateRange: { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) },
                jobsiteIds: [],
                employeeIds: [],
                status: 'all'
              })}
              className="h-7 px-2 text-xs gap-1 ml-auto"
            >
              <X className="h-3 w-3" />
              Clear All
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <TimeSummaryFilters filters={filters} onFiltersChange={setFilters} />

      {/* Summary Table */}
      <TimeSummaryTable 
        data={data || []} 
        isLoading={isLoading}
        startDate={filters.dateRange.start}
        endDate={filters.dateRange.end}
      />
    </div>
  );
};

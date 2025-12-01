import React, { useState, useEffect } from 'react';
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
        
        // Remove inactive/stale queries first to prevent race conditions
        queryClient.removeQueries({ 
          queryKey: ['time-summary'],
          type: 'inactive'
        });
        
        // Then invalidate current query
        queryClient.invalidateQueries({ 
          queryKey: ['time-summary', user.companyId],
          exact: false
        });
      },
      { companyId: user.companyId }
    );

    return () => {
      console.log('[Time Summary] Cleaning up real-time subscription');
      unsubscribe.then(unsub => unsub?.());
    };
  }, [user?.companyId, subscribe, queryClient]);

  const handleManualRefresh = () => {
    console.log('[Time Summary] Manual refresh triggered');
    queryClient.invalidateQueries({ queryKey: ['time-summary'] });
    queryClient.invalidateQueries({ queryKey: ['timeSummaryDetails'] });
    queryClient.refetchQueries({ queryKey: ['time-summary'] });
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

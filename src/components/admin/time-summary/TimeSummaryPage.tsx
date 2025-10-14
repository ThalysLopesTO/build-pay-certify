import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { TimeSummaryFilters } from './TimeSummaryFilters';
import { TimeSummaryTable } from './TimeSummaryTable';
import { TimeSummaryExport } from './TimeSummaryExport';
import { Button } from '@/components/ui/button';
import { useTimeSummaryData, TimeSummaryFilters as Filters } from '@/hooks/useTimeSummaryData';
import { startOfWeek, endOfWeek } from 'date-fns';
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

  const { data, isLoading } = useTimeSummaryData(filters);

  // Invalidate detail caches when date filters change
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['timeSummaryDetails'] });
  }, [filters.dateRange.start, filters.dateRange.end, queryClient]);

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
        
        // Force refetch with aggressive invalidation
        queryClient.invalidateQueries({ 
          queryKey: ['time-summary'],
          refetchType: 'all'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['timeSummaryDetails'],
          refetchType: 'all'
        });
        
        // Also force an immediate refetch
        queryClient.refetchQueries({ 
          queryKey: ['time-summary'],
          type: 'all'
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
        <div className="flex items-center gap-2">
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
          {data && data.length > 0 && (
            <TimeSummaryExport
              data={data}
              dateRange={filters.dateRange}
              companyName={companySettings?.company_name}
              companyLogo={companySettings?.company_logo_url || undefined}
            />
          )}
        </div>
      </div>

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

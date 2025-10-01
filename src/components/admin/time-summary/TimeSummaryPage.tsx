import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { TimeSummaryFilters } from './TimeSummaryFilters';
import { TimeSummaryTable } from './TimeSummaryTable';
import { TimeSummaryExport } from './TimeSummaryExport';
import { useTimeSummaryData, TimeSummaryFilters as Filters } from '@/hooks/useTimeSummaryData';
import { startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const TimeSummaryPage: React.FC = () => {
  const { user } = useAuth();
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Time Summary</h1>
            <p className="text-muted-foreground">
              View aggregated timesheet data for payroll processing
            </p>
          </div>
        </div>
        {data && data.length > 0 && (
          <TimeSummaryExport
            data={data}
            dateRange={filters.dateRange}
            companyName={companySettings?.company_name}
            companyLogo={companySettings?.company_logo_url || undefined}
          />
        )}
      </div>

      {/* Filters */}
      <TimeSummaryFilters filters={filters} onFiltersChange={setFilters} />

      {/* Summary Table */}
      <TimeSummaryTable data={data || []} isLoading={isLoading} />
    </div>
  );
};

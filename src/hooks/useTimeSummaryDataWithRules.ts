import React, { useMemo, useState, useEffect, useRef } from 'react';
import { JobsiteSummary, EmployeeSummary, useTimeSummaryData, TimeSummaryFilters } from './useTimeSummaryData';
import { calculateWorkedHours } from '@/lib/timeRules/calculateWorkedHours';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface EmployeeSummaryWithRules extends EmployeeSummary {
  total_raw_hours: number;
  total_paid_hours: number;
  issue_flags: string[];
  issue_count: number;
  days_worked: number;
}

export interface JobsiteSummaryWithRules extends Omit<JobsiteSummary, 'employees'> {
  employees: EmployeeSummaryWithRules[];
}

export const useTimeSummaryDataWithRules = (filters: TimeSummaryFilters) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: baseData, isLoading: isBaseLoading, isFetching: isBaseFetching, ...rest } = useTimeSummaryData(filters);
  const [dataWithRules, setDataWithRules] = useState<JobsiteSummaryWithRules[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Track which filters the current baseData was fetched with
  const lastFetchedFiltersRef = useRef<string | null>(null);

  // Track filter changes to clear stale data
  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        dateRange: filters.dateRange,
        jobsiteIds: filters.jobsiteIds,
        employeeIds: filters.employeeIds,
      }),
    [filters.dateRange, filters.jobsiteIds, filters.employeeIds]
  );

  // Clear dataWithRules and remove stale cached queries when filters change
  useEffect(() => {
    console.log('[Time Summary Rules] Filters changed, clearing stale data');
    setDataWithRules([]);
    lastFetchedFiltersRef.current = null; // Invalidate last fetched filters
    
    // Only remove INACTIVE queries from cache (old filter results)
    // Don't cancel the new query we want to run!
    queryClient.removeQueries({ 
      queryKey: ['time-summary'],
      type: 'inactive'
    });
    queryClient.removeQueries({ 
      queryKey: ['time-summary-raw-timesheets'],
      type: 'inactive'
    });
  }, [filtersKey, queryClient]);

  // Update lastFetchedFiltersRef when fetch completes successfully
  useEffect(() => {
    if (!isBaseFetching && baseData) {
      lastFetchedFiltersRef.current = filtersKey;
      console.log('[Time Summary Rules] Filters fetched successfully:', filtersKey);
    }
  }, [isBaseFetching, baseData, filtersKey]);

  // Immediately derive data from baseData (without rules), then enhance with rules
  useEffect(() => {
    // Skip if data is still fetching with new filters
    if (isBaseFetching) {
      console.log('[Time Summary Rules] Skipping update - still fetching');
      return;
    }
    
    // Skip if baseData doesn't match current filters
    if (filtersKey !== lastFetchedFiltersRef.current) {
      console.log('[Time Summary Rules] Waiting for data matching current filters');
      return;
    }
    
    if (!baseData || baseData.length === 0) {
      setDataWithRules([]);
      return;
    }

    // Safe to use baseData now - it matches current filters
    const immediateData: JobsiteSummaryWithRules[] = baseData.map((jobsite) => ({
      ...jobsite,
      employees: jobsite.employees.map((employee): EmployeeSummaryWithRules => ({
        ...employee,
        total_raw_hours: employee.total_hours,
        total_paid_hours: employee.total_hours,
        issue_flags: [],
        issue_count: 0,
        days_worked: employee.total_punches,
      })),
    }));
    
    setDataWithRules(immediateData);
  }, [baseData, filtersKey, isBaseFetching]);

  // Fetch raw timesheet data to calculate with rules
  const { data: rawTimesheets, isLoading: isTimesheetsLoading } = useQuery({
    queryKey: [
      'time-summary-raw-timesheets',
      user?.companyId,
      filters.dateRange.start.toISOString(),
      filters.dateRange.end.toISOString(),
      filters.jobsiteIds,
      filters.employeeIds,
    ],
    queryFn: async () => {
      if (!user?.companyId) return [];

      let query = supabase
        .from('timesheets')
        .select('*, jobsites(id, name)')
        .eq('company_id', user.companyId)
        .gte('check_in_time', filters.dateRange.start.toISOString())
        .lte('check_in_time', filters.dateRange.end.toISOString())
        .not('check_out_time', 'is', null); // Only completed punches

      if (filters.jobsiteIds && filters.jobsiteIds.length > 0) {
        query = query.in('jobsite_id', filters.jobsiteIds);
      }

      if (filters.employeeIds && filters.employeeIds.length > 0) {
        query = query.in('user_id', filters.employeeIds); // Use user_id not employee_id
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching raw timesheets:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.companyId && !!baseData && baseData.length > 0,
  });

  // Calculate rules when data is available
  useEffect(() => {
    // Don't calculate rules with stale data - wait until fetching is complete
    if (isBaseFetching || isTimesheetsLoading) {
      console.log('[Time Summary Rules] Waiting for data to finish loading before calculating rules');
      return;
    }
    
    // Skip if baseData doesn't match current filters
    if (filtersKey !== lastFetchedFiltersRef.current) {
      console.log('[Time Summary Rules] Skipping rule calculation - waiting for matching data');
      return;
    }
    
    if (!baseData || baseData.length === 0 || !rawTimesheets || !user?.companyId) {
      setDataWithRules([]);
      return;
    }

    const calculateRules = async () => {
      setIsCalculating(true);
      
      try {
        // Create a map of timesheet calculations
        const timesheetCalculations = new Map<string, {
          rawHours: number;
          paidHours: number;
          flags: string[];
        }>();

        // Calculate rules for each timesheet
        for (const timesheet of rawTimesheets) {
          const result = await calculateWorkedHours({
            rawIn: timesheet.check_in_time,
            rawOut: timesheet.check_out_time!,
            jobsiteId: timesheet.jobsite_id,
            companyId: user.companyId,
            date: new Date(timesheet.check_in_time).toISOString().split('T')[0],
          });

          const rawHours = result.totalMinutes / 60;
          const paidHours = result.paidMinutes / 60;

          timesheetCalculations.set(timesheet.id, {
            rawHours,
            paidHours,
            flags: result.flags || [],
          });
        }

        // Aggregate by employee
        const employeeAggregations = new Map<string, {
          totalRawHours: number;
          totalPaidHours: number;
          allFlags: string[];
          daysWorked: Set<string>;
        }>();

        rawTimesheets.forEach((timesheet) => {
          const calc = timesheetCalculations.get(timesheet.id);
          if (!calc) return;

          const key = `${timesheet.user_id}-${timesheet.jobsite_id}`; // Use user_id not employee_id
          const existing = employeeAggregations.get(key);
          const date = new Date(timesheet.check_in_time).toISOString().split('T')[0];

          if (existing) {
            existing.totalRawHours += calc.rawHours;
            existing.totalPaidHours += calc.paidHours;
            existing.allFlags.push(...calc.flags);
            existing.daysWorked.add(date);
          } else {
            employeeAggregations.set(key, {
              totalRawHours: calc.rawHours,
              totalPaidHours: calc.paidHours,
              allFlags: [...calc.flags],
              daysWorked: new Set([date]),
            });
          }
        });

        // Apply calculations to base data
        const enhancedData: JobsiteSummaryWithRules[] = baseData.map((jobsite) => ({
          ...jobsite,
          employees: jobsite.employees.map((employee): EmployeeSummaryWithRules => {
            const key = `${employee.employee_id}-${jobsite.jobsite_id}`;
            const aggregation = employeeAggregations.get(key);

            if (aggregation) {
              return {
                ...employee,
                total_raw_hours: Number(aggregation.totalRawHours.toFixed(2)),
                total_paid_hours: Number(aggregation.totalPaidHours.toFixed(2)),
                issue_flags: Array.from(new Set(aggregation.allFlags)),
                issue_count: aggregation.allFlags.length,
                days_worked: aggregation.daysWorked.size,
              };
            }

            // No time rules or no timesheets - use base data
            return {
              ...employee,
              total_raw_hours: employee.total_hours,
              total_paid_hours: employee.total_hours,
              issue_flags: [],
              issue_count: 0,
              days_worked: employee.total_punches, // Approximate
            };
          }),
        }));

        setDataWithRules(enhancedData);
      } catch (error) {
        console.error('Error calculating time rules:', error);
        // Fallback to base data
        const fallbackData: JobsiteSummaryWithRules[] = baseData.map((jobsite) => ({
          ...jobsite,
          employees: jobsite.employees.map((employee): EmployeeSummaryWithRules => ({
            ...employee,
            total_raw_hours: employee.total_hours,
            total_paid_hours: employee.total_hours,
            issue_flags: [],
            issue_count: 0,
            days_worked: employee.total_punches,
          })),
        }));
        setDataWithRules(fallbackData);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateRules();
  }, [baseData, rawTimesheets, user?.companyId, isBaseFetching, isTimesheetsLoading, filtersKey]);

  return {
    data: dataWithRules,
    isLoading: isBaseLoading || isTimesheetsLoading || isCalculating || isBaseFetching,
    isFetching: isBaseFetching,
    ...rest,
  };
};

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { JobsiteSummary, EmployeeSummary, useTimeSummaryData, TimeSummaryFilters } from './useTimeSummaryData';
import { calculateWorkedHours } from '@/lib/timeRules/calculateWorkedHours';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export interface EmployeeSummaryWithRules extends EmployeeSummary {
  total_raw_hours: number;
  total_paid_hours: number;
  total_break_minutes: number;
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
  const { data: queryResult, isLoading: isBaseLoading, isFetching: isBaseFetching, ...rest } = useTimeSummaryData(filters);
  const [dataWithRules, setDataWithRules] = useState<JobsiteSummaryWithRules[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isRulesReady, setIsRulesReady] = useState(false);
  
  // Track which filterHash the dataWithRules state was computed for
  const lastValidatedHashRef = useRef<string | null>(null);

  // Create current filter hash for comparison
  const currentFilterHash = useMemo(() => {
    const startDate = format(filters.dateRange.start, 'yyyy-MM-dd');
    const endDate = format(filters.dateRange.end, 'yyyy-MM-dd');
    return JSON.stringify({
      employeeIds: filters.employeeIds || [],
      jobsiteIds: filters.jobsiteIds || [],
      startDate,
      endDate,
      status: filters.status,
    });
  }, [filters]);

  // Validate that baseData matches current filters
  const baseData = useMemo(() => {
    if (!queryResult) {
      console.log('[Time Summary Rules] No query result yet');
      return null;
    }

    // Handle new format with filter validation
    if ('summaries' in queryResult && 'filterHash' in queryResult) {
      const { summaries, filterHash } = queryResult;

      // Compare filter hashes to ensure data matches current filters
      if (filterHash !== currentFilterHash) {
        console.log('[Time Summary Rules] Data/filter mismatch - waiting for correct data', {
          dataHash: filterHash,
          currentHash: currentFilterHash,
        });
        return null;
      }

      console.log('[Time Summary Rules] Data validated - matches current filters');
      return summaries;
    }

    // Shouldn't happen with new implementation, but handle gracefully
    console.warn('[Time Summary Rules] Unexpected query result format');
    return null;
  }, [queryResult, currentFilterHash]);

  // Clear stale data when filters change
  useEffect(() => {
    console.log('[Time Summary Rules] Filters changed, clearing stale data');
    setDataWithRules([]);
    setIsRulesReady(false);
    
    // Only remove INACTIVE queries from cache (old filter results)
    queryClient.removeQueries({ 
      queryKey: ['time-summary'],
      type: 'inactive'
    });
    queryClient.removeQueries({ 
      queryKey: ['time-summary-raw-timesheets'],
      type: 'inactive'
    });
  }, [currentFilterHash, queryClient]);

  // Derive immediate data from validated baseData
  useEffect(() => {
    if (isBaseFetching) {
      console.log('[Time Summary Rules] Skipping update - still fetching');
      return;
    }
    
    if (!baseData || baseData.length === 0) {
      setDataWithRules([]);
      return;
    }

    console.log('[Time Summary Rules] Setting immediate data from validated baseData');
    const immediateData: JobsiteSummaryWithRules[] = baseData.map((jobsite) => ({
      ...jobsite,
      employees: jobsite.employees.map((employee): EmployeeSummaryWithRules => ({
        ...employee,
        total_raw_hours: employee.total_hours,
        total_paid_hours: employee.total_hours,
        total_break_minutes: 0,
        issue_flags: [],
        issue_count: 0,
        days_worked: employee.total_punches,
      })),
    }));
    
    setDataWithRules(immediateData);
    lastValidatedHashRef.current = currentFilterHash;
    
    // Pre-set isCalculating to true to close the race condition gap
    // This prevents exports from being enabled before rules are applied
    if (baseData.length > 0) {
      setIsCalculating(true);
      setIsRulesReady(false);
    }
  }, [baseData, isBaseFetching]);

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

      // Create proper date boundaries to include the entire end date
      const startOfStartDate = new Date(filters.dateRange.start);
      startOfStartDate.setHours(0, 0, 0, 0);

      const endOfEndDate = new Date(filters.dateRange.end);
      endOfEndDate.setHours(23, 59, 59, 999);

      let query = supabase
        .from('timesheets')
        .select('*, jobsites(id, name)')
        .eq('company_id', user.companyId)
        .gte('check_in_time', startOfStartDate.toISOString())
        .lte('check_in_time', endOfEndDate.toISOString())
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
    if (isBaseFetching || isTimesheetsLoading) {
      console.log('[Time Summary Rules] Waiting for data to finish loading before calculating rules');
      return;
    }
    
    if (!baseData || baseData.length === 0 || !rawTimesheets || !user?.companyId) {
      return;
    }

    console.log('[Time Summary Rules] Starting rule calculation for validated data');

    const calculateRules = async () => {
      setIsCalculating(true);
      
      try {
        // Create a map of timesheet calculations
        const timesheetCalculations = new Map<string, {
          rawHours: number;
          paidHours: number;
          breakMinutes: number;
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
          
          // Check for manually stored break_minutes and use it if available
          const storedBreakMinutes = timesheet.break_minutes;
          let paidMinutes: number;
          
          if (storedBreakMinutes !== null && storedBreakMinutes !== undefined) {
            // Stored break takes priority - recalculate paid from raw totalMinutes
            paidMinutes = Math.max(0, result.totalMinutes - storedBreakMinutes);
          } else {
            // No stored break - use calculated values from time rules
            paidMinutes = result.paidMinutes;
          }
          
          const paidHours = paidMinutes / 60;
          const breakMinutes = result.totalMinutes - paidMinutes;

          timesheetCalculations.set(timesheet.id, {
            rawHours,
            paidHours,
            breakMinutes,
            flags: result.flags || [],
          });
        }

        // Aggregate by employee
        const employeeAggregations = new Map<string, {
          totalRawHours: number;
          totalPaidHours: number;
          totalBreakMinutes: number;
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
            existing.totalBreakMinutes += calc.breakMinutes;
            existing.allFlags.push(...calc.flags);
            existing.daysWorked.add(date);
          } else {
            employeeAggregations.set(key, {
              totalRawHours: calc.rawHours,
              totalPaidHours: calc.paidHours,
              totalBreakMinutes: calc.breakMinutes,
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
                total_break_minutes: Math.round(aggregation.totalBreakMinutes),
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
              total_break_minutes: 0,
              issue_flags: [],
              issue_count: 0,
              days_worked: employee.total_punches, // Approximate
            };
          }),
        }));

        setDataWithRules(enhancedData);
        lastValidatedHashRef.current = currentFilterHash;
        setIsRulesReady(true);
      } catch (error) {
        console.error('Error calculating time rules:', error);
        // Fallback to base data
        const fallbackData: JobsiteSummaryWithRules[] = baseData.map((jobsite) => ({
          ...jobsite,
          employees: jobsite.employees.map((employee): EmployeeSummaryWithRules => ({
            ...employee,
            total_raw_hours: employee.total_hours,
            total_paid_hours: employee.total_hours,
            total_break_minutes: 0,
            issue_flags: [],
            issue_count: 0,
            days_worked: employee.total_punches,
          })),
        }));
        setDataWithRules(fallbackData);
        setIsRulesReady(true);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateRules();
  }, [baseData, rawTimesheets, user?.companyId, isBaseFetching, isTimesheetsLoading]);

  // CRITICAL: Return validated data synchronously to prevent stale data exports
  const validatedData = useMemo(() => {
    // If baseData is null (filters don't match), return empty array
    if (!baseData) {
      console.log('[Time Summary Rules] No validated baseData - returning empty array');
      return [];
    }
    
    // If we have enhanced data with rules that matches current filters, use it
    if (dataWithRules.length > 0 && currentFilterHash === lastValidatedHashRef.current) {
      console.log('[Time Summary Rules] Returning enhanced data with rules');
      return dataWithRules;
    }
    
    // Otherwise return baseData transformed to WithRules format (immediate data)
    console.log('[Time Summary Rules] Returning immediate baseData (rules not yet calculated)');
    return baseData.map((jobsite) => ({
      ...jobsite,
      employees: jobsite.employees.map((employee): EmployeeSummaryWithRules => ({
        ...employee,
        total_raw_hours: employee.total_hours,
        total_paid_hours: employee.total_hours,
        total_break_minutes: 0,
        issue_flags: [],
        issue_count: 0,
        days_worked: employee.total_punches,
      })),
    }));
  }, [baseData, dataWithRules, currentFilterHash]);

  return {
    data: validatedData,  // Always returns filter-validated data
    isLoading: isBaseLoading || isTimesheetsLoading || isCalculating || isBaseFetching,
    isRulesReady,
    isFetching: isBaseFetching,
    ...rest,
  };
};

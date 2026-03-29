import React, { useMemo, useState, useEffect, useRef } from 'react';
import { JobsiteSummary, EmployeeSummary, useTimeSummaryData, TimeSummaryFilters } from './useTimeSummaryData';
import { calculateWorkedHours, preloadTimeRules } from '@/lib/timeRules/calculateWorkedHours';
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
  
  const lastValidatedHashRef = useRef<string | null>(null);

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

  const baseData = useMemo(() => {
    if (!queryResult) return null;

    if ('summaries' in queryResult && 'filterHash' in queryResult) {
      const { summaries, filterHash } = queryResult;
      if (filterHash !== currentFilterHash) return null;
      return summaries;
    }

    return null;
  }, [queryResult, currentFilterHash]);

  // Clear stale data when filters change
  useEffect(() => {
    setDataWithRules([]);
    setIsRulesReady(false);
    
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
    if (isBaseFetching) return;
    
    if (!baseData || baseData.length === 0) {
      setDataWithRules([]);
      return;
    }

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
    
    if (baseData.length > 0) {
      setIsCalculating(true);
      setIsRulesReady(false);
    }
  }, [baseData, isBaseFetching]);

  // Fetch raw timesheet data — include incomplete punches (no check_out filter)
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

      const startOfStartDate = new Date(filters.dateRange.start);
      startOfStartDate.setHours(0, 0, 0, 0);

      const endOfEndDate = new Date(filters.dateRange.end);
      endOfEndDate.setHours(23, 59, 59, 999);

      let query = supabase
        .from('timesheets')
        .select('*, jobsites(id, name), dismissed_flags')
        .eq('company_id', user.companyId)
        .gte('check_in_time', startOfStartDate.toISOString())
        .lte('check_in_time', endOfEndDate.toISOString());
        // Removed: .not('check_out_time', 'is', null) — we now include incomplete punches

      if (filters.jobsiteIds && filters.jobsiteIds.length > 0) {
        query = query.in('jobsite_id', filters.jobsiteIds);
      }

      if (filters.employeeIds && filters.employeeIds.length > 0) {
        query = query.in('user_id', filters.employeeIds);
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
    if (isBaseFetching || isTimesheetsLoading) return;
    
    if (!baseData || baseData.length === 0 || !rawTimesheets || !user?.companyId) {
      if (rawTimesheets && rawTimesheets.length === 0 && baseData && baseData.length > 0) {
        setIsCalculating(false);
        setIsRulesReady(true);
      }
      return;
    }

    const calculateRules = async () => {
      setIsCalculating(true);
      
      try {
        // ── Phase 1: Batch preload all jobsite rules in ONE query ──
        const uniqueJobsiteIds = [...new Set(rawTimesheets.map((t) => t.jobsite_id).filter(Boolean))];
        if (uniqueJobsiteIds.length > 0) {
          await preloadTimeRules(uniqueJobsiteIds);
        }

        const timesheetCalculations = new Map<string, {
          rawHours: number;
          paidHours: number;
          breakMinutes: number;
          flags: string[];
        }>();

        for (const timesheet of rawTimesheets) {
          // ── Phase 3: Handle missing clock-out ──
          if (!timesheet.check_out_time) {
            timesheetCalculations.set(timesheet.id, {
              rawHours: 0,
              paidHours: 0,
              breakMinutes: 0,
              flags: ['MISSING_CHECKOUT'],
            });
            continue;
          }

          const result = await calculateWorkedHours({
            rawIn: timesheet.check_in_time,
            rawOut: timesheet.check_out_time,
            jobsiteId: timesheet.jobsite_id,
            companyId: user.companyId,
            date: new Date(timesheet.check_in_time).toISOString().split('T')[0],
          });

          const rawHours = result.totalMinutes / 60;
          
          const storedBreakMinutes = timesheet.break_minutes;
          let paidMinutes: number;
          
          if (storedBreakMinutes !== null && storedBreakMinutes !== undefined) {
            paidMinutes = Math.max(0, result.totalMinutes - storedBreakMinutes);
          } else {
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

          const key = `${timesheet.user_id}-${timesheet.jobsite_id}`;
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

            return {
              ...employee,
              total_raw_hours: employee.total_hours,
              total_paid_hours: employee.total_hours,
              total_break_minutes: 0,
              issue_flags: [],
              issue_count: 0,
              days_worked: employee.total_punches,
            };
          }),
        }));

        setDataWithRules(enhancedData);
        lastValidatedHashRef.current = currentFilterHash;
        setIsRulesReady(true);
      } catch (error) {
        console.error('Error calculating time rules:', error);
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

  const validatedData = useMemo(() => {
    if (!baseData) return [];
    
    if (dataWithRules.length > 0 && currentFilterHash === lastValidatedHashRef.current) {
      return dataWithRules;
    }
    
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
    data: validatedData,
    isLoading: isBaseLoading || isTimesheetsLoading || isCalculating || isBaseFetching,
    isRulesReady,
    isFetching: isBaseFetching,
    ...rest,
  };
};

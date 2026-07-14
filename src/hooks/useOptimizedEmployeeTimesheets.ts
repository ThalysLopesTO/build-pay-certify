import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { queryKeys } from '@/lib/queryKeyFactory';
import { CACHE_STRATEGIES } from '@/lib/optimizedQueryClient';
import { fetchProfilesByUserIds } from '@/lib/users/fetchProfiles';

interface TimesheetFilters {
  employeeName?: string;
  weekEndingDate?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export const useOptimizedEmployeeTimesheets = (filters: TimesheetFilters = {}) => {
  const { user } = useAuth();
  const { limit = 50, offset = 0, ...otherFilters } = filters;

  return useQuery({
    queryKey: queryKeys.timesheet.employee(user?.companyId || '', JSON.stringify(otherFilters)),
    queryFn: async () => {
      if (!user?.companyId) return { data: [], total: 0 };

      // Employee profiles are fetched separately (the user_id FK no longer
      // embeds after multi-company repointing). To filter by name we first
      // resolve matching user_ids, then filter timesheets by them so DB-level
      // pagination and count stay correct.
      let nameFilterUserIds: string[] | null = null;
      if (otherFilters.employeeName) {
        const term = `%${otherFilters.employeeName}%`;
        const { data: matches } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('company_id', user.companyId)
          .or(`first_name.ilike.${term},last_name.ilike.${term}`);
        nameFilterUserIds = Array.from(new Set((matches || []).map((m) => m.user_id)));
        if (nameFilterUserIds.length === 0) {
          return { data: [], total: 0, hasMore: false };
        }
      }

      let query = supabase
        .from('timesheets')
        .select(`
          *,
          jobsites(name)
        `, { count: 'exact' })
        .eq('company_id', user.companyId)
        .order('check_in_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (nameFilterUserIds) {
        query = query.in('user_id', nameFilterUserIds);
      }

      if (otherFilters.weekEndingDate) {
        const startOfWeek = new Date(otherFilters.weekEndingDate);
        startOfWeek.setDate(startOfWeek.getDate() - 6);
        const endOfWeek = new Date(otherFilters.weekEndingDate);
        
        query = query
          .gte('check_in_time', startOfWeek.toISOString())
          .lte('check_in_time', endOfWeek.toISOString());
      }

      if (otherFilters.status && otherFilters.status !== 'all') {
        query = query.eq('status', otherFilters.status);
      }

      const { data: timesheets, error, count } = await query;

      if (error) {
        console.error('Error fetching employee timesheets:', error);
        throw error;
      }

      if (!timesheets) return { data: [], total: 0 };

      // Attach employee profiles fetched separately
      const profileMap = await fetchProfilesByUserIds(timesheets.map((t: any) => t.user_id));

      // Transform data with calculated fields
      const transformedData = timesheets.map(timesheet => {
        const profile = profileMap[(timesheet as any).user_id] || null;
        const hoursWorked = timesheet.check_in_time && timesheet.check_out_time
          ? (new Date(timesheet.check_out_time).getTime() - new Date(timesheet.check_in_time).getTime()) / (1000 * 60 * 60)
          : 0;

        return {
          ...timesheet,
          user_profiles: profile,
          employee_name: profile
            ? `${profile.first_name} ${profile.last_name}`
            : 'Former Employee',
          jobsite_name: timesheet.jobsites?.name || 'Unknown Jobsite',
          hours_worked: Math.round(hoursWorked * 100) / 100, // Round to 2 decimal places
        };
      });

      return {
        data: transformedData,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    },
    enabled: !!user?.companyId,
    ...CACHE_STRATEGIES.DYNAMIC,
  });
};
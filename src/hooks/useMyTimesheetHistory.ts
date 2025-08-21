import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface TimesheetHistoryEntry {
  id: string;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  gross_pay: number;
  status: string;
  created_at: string;
  updated_at?: string;
  jobsite_name?: string;
  worker_type: string;
  hourly_rate: number;
  biWeeklyData?: {
    week1: any;
    week2: any;
  };
}

export const useMyTimesheetHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-timesheet-history', user?.id],
    queryFn: async (): Promise<TimesheetHistoryEntry[]> => {
      if (!user?.id || !user?.companyId) return [];

      const { data, error } = await supabase
        .from('weekly_timesheets')
        .select(`
          id,
          week_start_date,
          total_hours,
          gross_pay,
          status,
          created_at,
          updated_at,
          worker_type,
          hourly_rate,
          notes,
          jobsites (
            name
          )
        `)
        .eq('submitted_by', user.id)
        .eq('company_id', user.companyId)
        .order('week_start_date', { ascending: false });

      if (error) {
        console.error('Error fetching timesheet history:', error);
        throw error;
      }

      return data.map(timesheet => {
        // Calculate week end date based on start date
        const startDate = new Date(timesheet.week_start_date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 13); // Bi-weekly (14 days - 1)

        // Parse bi-weekly data if present
        let biWeeklyData = null;
        if (timesheet.notes && timesheet.notes.includes('__biweekly_json__')) {
          try {
            const jsonMatch = timesheet.notes.match(/__biweekly_json__:(.*?)__end_biweekly_json__/);
            if (jsonMatch) {
              biWeeklyData = JSON.parse(jsonMatch[1]);
            }
          } catch (e) {
            console.error('Error parsing bi-weekly data:', e);
          }
        }

        return {
          id: timesheet.id,
          week_start_date: timesheet.week_start_date,
          week_end_date: endDate.toISOString().split('T')[0],
          total_hours: timesheet.total_hours || 0,
          gross_pay: timesheet.gross_pay || 0,
          status: timesheet.status || 'pending',
          created_at: timesheet.created_at,
          updated_at: timesheet.updated_at,
          jobsite_name: (timesheet.jobsites as any)?.name || 'Unknown Jobsite',
          worker_type: timesheet.worker_type || 'employee',
          hourly_rate: timesheet.hourly_rate || 0,
          biWeeklyData
        };
      });
    },
    enabled: !!user?.id && !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
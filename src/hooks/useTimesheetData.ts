import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface UseTimesheetDataProps {
  userId?: string;
  weekStartDate?: string;
  enabled?: boolean;
}

export const useTimesheetData = ({ userId, weekStartDate, enabled = true }: UseTimesheetDataProps) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['timesheet-data', userId, weekStartDate],
    queryFn: async () => {
      if (!userId || !weekStartDate || !user?.companyId) return null;

      const { data: timesheet, error } = await supabase
        .from('weekly_timesheets')
        .select('*')
        .eq('submitted_by', userId)
        .eq('week_start_date', weekStartDate)
        .eq('company_id', user.companyId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching timesheet data:', error);
        throw error;
      }

      if (!timesheet) return null;

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
        ...timesheet,
        biWeeklyData
      };
    },
    enabled: enabled && !!userId && !!weekStartDate && !!user?.companyId,
  });
};
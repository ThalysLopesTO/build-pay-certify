
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface TimesheetFilters {
  employeeName?: string;
  weekEndingDate?: string;
  status?: string;
  jobsiteId?: string;
}

export const useWeeklyTimesheets = (filters: TimesheetFilters = {}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-timesheets', user?.companyId, filters],
    queryFn: async () => {
      if (!user?.companyId) return [];

      // Get weekly timesheets - these are employee submissions
      let query = supabase
        .from('weekly_timesheets')
        .select(`
          id,
          submitted_by,
          company_id,
          jobsite_id,
          week_start_date,
          monday_hours,
          tuesday_hours,
          wednesday_hours,
          thursday_hours,
          friday_hours,
          saturday_hours,
          sunday_hours,
          hourly_rate,
          additional_expense,
          notes,
          status,
          total_hours,
          gross_pay,
          tax_included,
          calculated_tax,
          is_manual_entry,
          manual_entry_name,
          worker_type,
          income_tax_rate,
          cpp_rate,
          ei_rate,
          created_at,
          jobsites(name)
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      // Apply status filter if provided
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply jobsite filter if provided
      if (filters.jobsiteId) {
        query = query.eq('jobsite_id', filters.jobsiteId);
      }

      const { data: timesheets, error } = await query;

      if (error) {
        console.error('Error fetching weekly timesheets:', error);
        throw error;
      }

      if (!timesheets) return [];

      // Get user profiles for employee names (only for non-manual entries)
      const regularTimesheets = timesheets.filter(t => !t.is_manual_entry && t.submitted_by);
      const userIds = [...new Set(regularTimesheets.map(t => t.submitted_by))];
      
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, worker_type')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching user profiles:', profilesError);
          throw profilesError;
        }
        profiles = profilesData || [];
      }

      // Create a map of user profiles for quick lookup
      const profileMap = new Map(
        profiles.map(profile => [profile.user_id, profile])
      );

      // Get company settings for tax calculation
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('tax_percentage')
        .eq('company_id', user.companyId)
        .single();

      const taxPercentage = companySettings?.tax_percentage || 13;

      // Transform the data to include employee names and calculated fields
      let result = timesheets.map(timesheet => {
        let employeeName: string;
        let workerType: string;
        
        if (timesheet.is_manual_entry) {
          // For manual entries, use the manual_entry_name and stored worker_type
          employeeName = timesheet.manual_entry_name || 'Unknown Guest';
          workerType = timesheet.worker_type || 'subcontractor';
        } else {
          // For regular entries, use the profile data
          const profile = profileMap.get(timesheet.submitted_by);
          employeeName = profile ? `${profile.first_name} ${profile.last_name}` : 'Former Employee';
          workerType = profile?.worker_type || 'subcontractor';
        }
        
        const finalTotalPay = timesheet.tax_included 
          ? (timesheet.gross_pay || 0) + (timesheet.calculated_tax || 0)
          : (timesheet.gross_pay || 0);
        
        return {
          ...timesheet,
          employee_name: employeeName,
          worker_type: workerType,
          jobsite_name: Array.isArray((timesheet as any).jobsites)
            ? ((timesheet as any).jobsites[0]?.name || 'Unknown Jobsite')
            : ((timesheet as any).jobsites?.name || 'Unknown Jobsite'),
          week_ending_date: timesheet.week_start_date, // This will be the week start date from submissions
          final_total_pay: finalTotalPay,
        };
      });

      // Apply employee name filter if provided
      if (filters.employeeName) {
        result = result.filter(item => 
          item.employee_name.toLowerCase().includes(filters.employeeName!.toLowerCase())
        );
      }

      // Apply week ending date filter if provided
      if (filters.weekEndingDate) {
        result = result.filter(item => item.week_start_date === filters.weekEndingDate);
      }

      return result;
    },
    enabled: !!user?.companyId,
  });
};

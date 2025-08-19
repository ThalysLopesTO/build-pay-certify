import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface UseLivePunchDataOptions {
  selectedDate: Date;
  selectedJobsite?: string;
  selectedEmployee?: string;
  statusFilter?: string;
}

export const useLivePunchData = ({ 
  selectedDate, 
  selectedJobsite = 'all', 
  selectedEmployee = 'all', 
  statusFilter = 'all' 
}: UseLivePunchDataOptions) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['live-punch-data', user?.companyId, selectedDate, selectedJobsite, selectedEmployee, statusFilter],
    queryFn: async () => {
      if (!user?.companyId) return [];
      
      console.log('Fetching live punch data for:', {
        company: user.companyId,
        date: selectedDate,
        jobsite: selectedJobsite,
        employee: selectedEmployee,
        status: statusFilter
      });
      
      let query = supabase
        .from('timesheets')
        .select(`
          id,
          user_id,
          jobsite_id,
          check_in_time,
          check_out_time,
          check_in_location,
          check_out_location,
          work_note,
          status,
          created_at,
          user_profiles!inner(
            first_name,
            last_name
          ),
          jobsites(
            name,
            latitude,
            longitude
          )
        `)
        .eq('company_id', user.companyId);

      // Apply employee filter if selected
      if (selectedEmployee !== 'all') {
        query = query.eq('user_id', selectedEmployee);
      }

      // Apply jobsite filter if selected
      if (selectedJobsite !== 'all') {
        query = query.eq('jobsite_id', selectedJobsite);
      }

      // Apply date filter - always filter by selected date (which defaults to today)
      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Handle overnight shifts and various scenarios
        query = query.or(
          `and(check_in_time.gte.${startOfDay.toISOString()},check_in_time.lte.${endOfDay.toISOString()}),` +
          `and(check_out_time.gte.${startOfDay.toISOString()},check_out_time.lte.${endOfDay.toISOString()}),` +
          `and(created_at.gte.${startOfDay.toISOString()},created_at.lte.${endOfDay.toISOString()})`
        );
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching live punch data:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} punch entries for ${selectedDate.toDateString()}`);
      return data || [];
    },
    enabled: !!user?.companyId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    // Shorter stale time for live data
    staleTime: 30 * 1000, // 30 seconds
    // Shorter cache time to ensure fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
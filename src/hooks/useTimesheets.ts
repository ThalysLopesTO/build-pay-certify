
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek } from 'date-fns';

export interface Timesheet {
  id: string;
  user_id: string;
  jobsite_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  hours_worked: number | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  company_id: string;
}

export const useTimesheets = (selectedWeek?: Date) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get timesheets for the selected week (or current week if not specified)
  const { data: weeklyTimesheets, isLoading } = useQuery({
    queryKey: ['timesheets', user?.id, 'weekly', selectedWeek?.toISOString()],
    queryFn: async () => {
      if (!user?.id) return [];

      const targetWeek = selectedWeek || new Date();
      const startOfTargetWeek = startOfWeek(targetWeek, { weekStartsOn: 1 });
      const endOfTargetWeek = endOfWeek(targetWeek, { weekStartsOn: 1 });

      startOfTargetWeek.setHours(0, 0, 0, 0);
      endOfTargetWeek.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          *,
          jobsites:jobsite_id(name)
        `)
        .eq('user_id', user.id)
        .gte('check_in_time', startOfTargetWeek.toISOString())
        .lte('check_in_time', endOfTargetWeek.toISOString())
        .order('check_in_time', { ascending: false });

      if (error) {
        console.error('Error fetching weekly timesheets:', error);
        throw error;
      }

      return data as Timesheet[];
    },
    enabled: !!user?.id,
  });

  // Get today's active timesheet (checked in but not out) - always current day
  const { data: todayActiveTimesheet } = useQuery({
    queryKey: ['timesheets', user?.id, 'today-active'],
    queryFn: async () => {
      if (!user?.id) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          *,
          jobsites:jobsite_id(name)
        `)
        .eq('user_id', user.id)
        .gte('check_in_time', today.toISOString())
        .lt('check_in_time', tomorrow.toISOString())
        .is('check_out_time', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching today active timesheet:', error);
        throw error;
      }

      return data as Timesheet | null;
    },
    enabled: !!user?.id,
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async ({ jobsiteId, location }: { jobsiteId: string; location: string }) => {
      if (!user?.id || !user?.companyId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('timesheets')
        .insert({
          user_id: user.id,
          company_id: user.companyId,
          jobsite_id: jobsiteId,
          check_in_time: new Date().toISOString(),
          check_in_location: location,
        })
        .select()
        .single();

      if (error) {
        console.error('Error clocking in:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      toast({
        title: "Success",
        description: "Clocked in successfully!",
      });
    },
    onError: (error) => {
      console.error('Clock in error:', error);
      toast({
        title: "Error",
        description: "Failed to clock in. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async ({ timesheetId, location }: { timesheetId: string; location: string }) => {
      const { data, error } = await supabase
        .from('timesheets')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_location: location,
        })
        .eq('id', timesheetId)
        .select()
        .single();

      if (error) {
        console.error('Error clocking out:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      toast({
        title: "Success",
        description: "Clocked out successfully!",
      });
    },
    onError: (error) => {
      console.error('Clock out error:', error);
      toast({
        title: "Error",
        description: "Failed to clock out. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate total hours for the selected week
  const totalWeeklyHours = weeklyTimesheets?.reduce((total, timesheet) => {
    return total + (timesheet.hours_worked || 0);
  }, 0) || 0;

  return {
    weeklyTimesheets,
    todayActiveTimesheet,
    totalWeeklyHours,
    isLoading,
    clockIn: clockInMutation.mutate,
    clockOut: clockOutMutation.mutate,
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
  };
};

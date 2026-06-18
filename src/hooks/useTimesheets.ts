
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
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
  break_minutes: number | null;
  raw_hours: number;
  paid_hours: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  company_id: string;
}

const computeRawHours = (checkIn: string | null, checkOut: string | null): number => {
  if (!checkIn || !checkOut) return 0;
  const inTime = new Date(checkIn).getTime();
  const outTime = new Date(checkOut).getTime();
  if (isNaN(inTime) || isNaN(outTime)) return 0;
  const hours = (outTime - inTime) / (1000 * 60 * 60);
  return isNaN(hours) || hours < 0 ? 0 : hours;
};

/**
 * Module-level registry to prevent duplicate realtime subscriptions.
 * Key = channelName, Value = channel instance.
 */
const activeChannels = new Map<string, ReturnType<typeof supabase.channel>>();

export const useTimesheets = (selectedWeek?: Date) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelKeyRef = useRef<string | null>(null);

  // Real-time subscription — single-instance per user via module-level registry
  useEffect(() => {
    if (!user?.id) return;

    const channelKey = `timesheets-employee-${user.id}`;
    channelKeyRef.current = channelKey;

    // If a channel already exists for this user, skip — don't subscribe again
    if (activeChannels.has(channelKey)) {
      return;
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timesheets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['timesheets'] });
        }
      )
      .subscribe();

    activeChannels.set(channelKey, channel);

    return () => {
      // Only clean up if this effect owns the channel
      const existing = activeChannels.get(channelKey);
      if (existing === channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.warn('Error removing timesheets channel:', err);
        }
        activeChannels.delete(channelKey);
      }
    };
  }, [user?.id, queryClient]);

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

      // Compute raw_hours and paid_hours client-side
      return (data || []).map((t: any) => {
        const raw = computeRawHours(t.check_in_time, t.check_out_time);
        const breakHrs = (t.break_minutes || 0) / 60;
        return {
          ...t,
          raw_hours: raw,
          paid_hours: Math.max(0, raw - breakHrs),
        } as Timesheet;
      });
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
        .maybeSingle();

      if (error) {
        console.error('Error fetching today active timesheet:', error);
        return null;
      }

      if (!data) return null;

      const raw = computeRawHours(data.check_in_time, data.check_out_time);
      const breakHrs = ((data as any).break_minutes || 0) / 60;
      return {
        ...data,
        raw_hours: raw,
        paid_hours: Math.max(0, raw - breakHrs),
      } as Timesheet;
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
      queryClient.invalidateQueries({ queryKey: ['active-clock-session'] });
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
    mutationFn: async ({ timesheetId, location, workNote, breakMinutes }: { timesheetId: string; location: string; workNote?: string; breakMinutes?: number }) => {
      const checkOutTime = new Date().toISOString();

      // Fetch check_in_time to compute raw minutes
      const { data: existing } = await supabase
        .from('timesheets')
        .select('check_in_time')
        .eq('id', timesheetId)
        .single();

      const rawMinutes = existing?.check_in_time
        ? Math.max(0, Math.round((new Date(checkOutTime).getTime() - new Date(existing.check_in_time).getTime()) / 60000))
        : 0;
      const effectiveBreak = breakMinutes ?? 0;
      const finalPayableMinutes = Math.max(0, rawMinutes - effectiveBreak);

      const updateData: Record<string, unknown> = {
        check_out_time: checkOutTime,
        check_out_location: location,
        break_minutes: effectiveBreak,
        raw_minutes: rawMinutes,
        final_payable_minutes: finalPayableMinutes,
      };

      if (workNote) {
        updateData.work_note = workNote;
      }

      const { data, error } = await supabase
        .from('timesheets')
        .update(updateData)
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
      queryClient.invalidateQueries({ queryKey: ['active-clock-session'] });
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

  // Calculate totals for the selected week
  const totalRawHours = weeklyTimesheets?.reduce((total, t) => total + t.raw_hours, 0) || 0;
  const totalBreakMinutes = weeklyTimesheets?.reduce((total, t) => total + (t.break_minutes || 0), 0) || 0;
  const totalPaidHours = weeklyTimesheets?.reduce((total, t) => total + t.paid_hours, 0) || 0;
  const totalWeeklyHours = totalPaidHours;

  return {
    weeklyTimesheets,
    todayActiveTimesheet,
    totalWeeklyHours,
    totalRawHours,
    totalBreakMinutes,
    totalPaidHours,
    isLoading,
    clockIn: clockInMutation.mutate,
    clockOut: clockOutMutation.mutate,
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
  };
};

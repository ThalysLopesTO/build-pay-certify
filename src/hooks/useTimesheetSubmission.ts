/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface TimesheetData {
  jobsite_id: string;
  week_start_date: string;
  additional_expense?: number;
  notes?: string;
  tax_included?: boolean;
  periods: any;
  tax: any;
  total_hours: any;
  gross_pay: any;
  hours_pay: any;
  total_pay: any;
}

export const useTimesheetSubmission = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TimesheetData) => {
      // Fetch user profile data for worker type and tax rates
      let userProfile: any = null;
      if (user?.id) {
        let profileQuery = supabase
          .from('user_profiles')
          .select('worker_type, income_tax_rate, cpp_rate, ei_rate')
          .eq('user_id', user.id);
        if (user.companyId) {
          profileQuery = profileQuery.eq('company_id', user.companyId);
        }
        const { data: profileData } = await profileQuery.limit(1).maybeSingle();
        userProfile = profileData;
      }

      // Enhanced authentication checks
      if (!session?.access_token) {
        console.error('❌ No valid session found');
        throw new Error('Please log out and log back in to submit timesheets');
      }

      if (!user?.id) {
        console.error('❌ No user ID found');
        throw new Error('User not authenticated. Please log out and log back in.');
      }

      if (!user?.companyId) {
        console.error('❌ No company ID found for user');
        throw new Error('No company assigned to your account. Please contact your administrator.');
      }

      // Get employee name from user profile
      const employeeName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : 'Unknown Employee';
      // Create the payload - do NOT include total_hours or gross_pay as they are calculated by the trigger
      const timesheetPayload = {
        ...data,
        submitted_by: user.id,
        company_id: user.companyId,
        status: 'pending',
        employee_name: employeeName,
        worker_type: userProfile?.worker_type || 'subcontractor',
        income_tax_rate: userProfile?.income_tax_rate || null,
        cpp_rate: userProfile?.cpp_rate || null,
        ei_rate: userProfile?.ei_rate || null,
      };

      const { data: result, error } = await supabase
        .from('weekly_timesheets')
        .insert([timesheetPayload])
        .select('*')
        .single();

      if (error) {
        console.error('💥 Timesheet submission error details:', {
          error: error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Provide more specific error messages based on the actual error
        if (error.code === '42501') {
          throw new Error('Permission denied. Please ensure you are logged in and try again. If the problem persists, contact your administrator.');
        }

        if (error.code === 'PGRST301') {
          throw new Error('Database constraint violation. Please check your timesheet data.');
        }

        if (error.message?.includes('duplicate key')) {
          throw new Error('A timesheet for this week already exists. Please edit the existing timesheet instead.');
        }

        if (error.message?.includes('violates row-level security')) {
          throw new Error('Security policy violation. Please log out and log back in, then try again.');
        }

        throw new Error(error.message || 'Failed to submit timesheet');
      }

      console.log('✅ Timesheet submitted successfully:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('🎉 Timesheet submission successful, updating cache immediately');

      // Immediately update the existing timesheets cache
      // queryClient.setQueryData(['existing-timesheets', user?.id], (oldData: string[] = []) => {
      //   return [...oldData, variables.weekStartDate];
      // });

      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['employee-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-hours-summary'] });
      queryClient.invalidateQueries({ queryKey: ['nearly-timesheets'] });

      toast({
        title: "Timesheet Submitted",
        description: `Weekly timesheet for ${data?.total_hours || 0} hours submitted successfully`,
      });
    },
    onError: (error) => {
      console.error('🚨 Timesheet submission failed:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });
};

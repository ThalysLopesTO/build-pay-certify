/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useTimesheetSubmission } from './useTimesheetSubmission';
import { useCompanySettings } from './useCompanySettings';
import { useWorkWeek } from './useWorkWeek';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';
import { calculateTax } from '@/utils/taxCalculations';

const formSchema = z.object({
  jobsiteId: z.string().min(1, 'Please select a jobsite'),
  mondayHours: z.number().min(0).max(24),
  tuesdayHours: z.number().min(0).max(24),
  wednesdayHours: z.number().min(0).max(24),
  thursdayHours: z.number().min(0).max(24),
  fridayHours: z.number().min(0).max(24),
  saturdayHours: z.number().min(0).max(24),
  sundayHours: z.number().min(0).max(24),
  // Optional week 2 fields for bi-weekly frequency
  mondayHoursWeek2: z.number().min(0).max(24).optional(),
  tuesdayHoursWeek2: z.number().min(0).max(24).optional(),
  wednesdayHoursWeek2: z.number().min(0).max(24).optional(),
  thursdayHoursWeek2: z.number().min(0).max(24).optional(),
  fridayHoursWeek2: z.number().min(0).max(24).optional(),
  saturdayHoursWeek2: z.number().min(0).max(24).optional(),
  sundayHoursWeek2: z.number().min(0).max(24).optional(),
  additionalExpense: z.number().min(0).optional(),
  notes: z.string().optional(),
  tax_included: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

export const useTimesheetForm = (selectedWeek?:any) => {
  const { user, session } = useAuth();
  const { settings } = useCompanySettings();
  const submitMutation = useTimesheetSubmission();
  const workWeeks = useWorkWeek();
  
  const existingTimesheets = selectedWeek?.timesheet;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobsiteId: '',
      mondayHours: 0,
      tuesdayHours: 0,
      wednesdayHours: 0,
      thursdayHours: 0,
      fridayHours: 0,
      saturdayHours: 0,
      sundayHours: 0,
      // Week 2 defaults
      mondayHoursWeek2: 0,
      tuesdayHoursWeek2: 0,
      wednesdayHoursWeek2: 0,
      thursdayHoursWeek2: 0,
      fridayHoursWeek2: 0,
      saturdayHoursWeek2: 0,
      sundayHoursWeek2: 0,
      additionalExpense: 0,
      notes: '',
      tax_included: false,
    },
  });

  // Load existing timesheet data when available
  React.useEffect(() => {
    if (existingTimesheets) {
      const formData: FormData = {
        jobsiteId: existingTimesheets.jobsite_id || '',
        mondayHours: 0,
        tuesdayHours: 0,
        wednesdayHours: 0,
        thursdayHours: 0,
        fridayHours: 0,
        saturdayHours: 0,
        sundayHours: 0,
        mondayHoursWeek2: 0,
        tuesdayHoursWeek2: 0,
        wednesdayHoursWeek2: 0,
        thursdayHoursWeek2: 0,
        fridayHoursWeek2: 0,
        saturdayHoursWeek2: 0,
        sundayHoursWeek2: 0,
        additionalExpense: existingTimesheets.additional_expense || 0,
        notes: existingTimesheets.notes || '',
        tax_included: existingTimesheets.tax_included || false,
      };

      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

      // Map periods to form fields
      existingTimesheets.periods?.forEach(period => {
        const weekSuffix = period.week === 'week2' ? 'Week2' : '';

        period.days.forEach(dayObj => {
          // Each dayObj has one key for the day name, e.g., { monday: 4 }
          const dayName = Object.keys(dayObj)[0] as typeof weekdays[number];
          const hours = dayObj[dayName] || 0;

          formData[`${dayName}Hours${weekSuffix}`] = hours;
        });
      });

      form.reset(formData);
    } else {
      form.reset({
        jobsiteId: '',
        mondayHours: 0,
        tuesdayHours: 0,
        wednesdayHours: 0,
        thursdayHours: 0,
        fridayHours: 0,
        saturdayHours: 0,
        sundayHours: 0,
        // Week 2 defaults
        mondayHoursWeek2: 0,
        tuesdayHoursWeek2: 0,
        wednesdayHoursWeek2: 0,
        thursdayHoursWeek2: 0,
        fridayHoursWeek2: 0,
        saturdayHoursWeek2: 0,
        sundayHoursWeek2: 0,
        additionalExpense: 0,
        notes: '',
        tax_included: false,
      });
    }
  }, [existingTimesheets, form]);

  const watchedValues = form.watch();
  const isBiWeekly = (settings as any)?.timesheet_frequency === 'bi-weekly';
  const totalHours = (
    watchedValues.mondayHours + watchedValues.tuesdayHours +
    watchedValues.wednesdayHours + watchedValues.thursdayHours +
    watchedValues.fridayHours + watchedValues.saturdayHours +
    watchedValues.sundayHours +
    (isBiWeekly ? (
      (watchedValues.mondayHoursWeek2 || 0) + (watchedValues.tuesdayHoursWeek2 || 0) +
      (watchedValues.wednesdayHoursWeek2 || 0) + (watchedValues.thursdayHoursWeek2 || 0) +
      (watchedValues.fridayHoursWeek2 || 0) + (watchedValues.saturdayHoursWeek2 || 0) +
      (watchedValues.sundayHoursWeek2 || 0)
    ) : 0)
  );

  // Fetch current hourly rate from database to ensure it's up-to-date
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-hourly-rate', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('hourly_rate')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching current hourly rate:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  // Use the most current hourly rate (database first, then auth fallback)
  const hourlyRate = currentUserProfile?.hourly_rate ?? user?.hourlyRate ?? 25;
  const grossPay = (totalHours * hourlyRate) + (watchedValues.additionalExpense || 0);

  const isWeekSubmitted = existingTimesheets;

  const onSubmit = (data: FormData) => {
    console.log('👤 Current user state:', {
      userId: user?.id,
      companyId: user?.companyId,
      email: user?.email,
      isAuthenticated: !!user?.id,
      hasSession: !!session,
      sessionValid: !!session?.access_token
    });

    // Enhanced validation checks
    if (totalHours === 0) {
      toast({
        title: "No Hours Entered",
        description: "Please enter at least one hour for the week",
        variant: "destructive",
      });
      return;
    }

    if (!session?.access_token) {
      console.error('❌ Session validation failed: No valid session');
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log out and log back in.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      console.error('❌ Authentication validation failed: No user ID');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit a timesheet. Please log out and log back in.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.companyId) {
      console.error('❌ Company validation failed: No company ID');
      toast({
        title: "Company Assignment Error",
        description: "No company assigned to your account. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWeek) {
      console.error('❌ Week selection validation failed');
      toast({
        title: "Week Selection Error",
        description: "Please select a week to submit timesheet for.",
        variant: "destructive",
      });
      return;
    }

    if (isWeekSubmitted) {
      toast({
        title: "Duplicate Submission",
        description: "You have already submitted a timesheet for this week.",
        variant: "destructive",
      });
      return;
    }

    const week1Hours = data.mondayHours + data.tuesdayHours + data.wednesdayHours +
      data.thursdayHours + data.fridayHours + data.saturdayHours + data.sundayHours;
    const week2Hours = (form.getValues('mondayHoursWeek2') || 0) + (form.getValues('tuesdayHoursWeek2') || 0) +
      (form.getValues('wednesdayHoursWeek2') || 0) + (form.getValues('thursdayHoursWeek2') || 0) +
      (form.getValues('fridayHoursWeek2') || 0) + (form.getValues('saturdayHoursWeek2') || 0) +
      (form.getValues('sundayHoursWeek2') || 0);

    const totalTimesheetHours = week1Hours + week2Hours;
    const hoursPayAmount = totalTimesheetHours * hourlyRate;
    const additionalExpenseAmount = data.additionalExpense || 0;
    const grossPay = hoursPayAmount + additionalExpenseAmount;

    const tax = calculateTax({
      gross_pay: grossPay,
      tax_included: false,
      type: 'employee'
    });

    const periods = [{
      week: "week1",
      days: [
        { friday: data.fridayHours },
        { saturday: data.saturdayHours },
        { sunday: data.sundayHours },
        { monday: data.mondayHours },
        { tuesday: data.tuesdayHours },
        { wednesday: data.wednesdayHours },
        { thursday: data.thursdayHours },
      ]
    }]

    if (isBiWeekly) {
      periods.push({
        week: "week2",
        days: [
          { friday: data.fridayHoursWeek2 || 0 },
          { saturday: data.saturdayHoursWeek2 || 0 },
          { sunday: data.sundayHoursWeek2 || 0 },
          { monday: data.mondayHoursWeek2 || 0 },
          { tuesday: data.tuesdayHoursWeek2 || 0 },
          { wednesday: data.wednesdayHoursWeek2 || 0 },
          { thursday: data.thursdayHoursWeek2 || 0 },
        ]
      })
    }

    const timesheetData = {
      jobsite_id: data.jobsiteId,
      week_start_date: selectedWeek.weekStartDateString,
      additional_expense: additionalExpenseAmount,
      notes: data.notes,
      tax_included: false,
      periods: periods,
      tax: 0, // 13% HST if tax included
      total_hours: totalTimesheetHours,
      gross_pay: grossPay,
      hours_pay: hoursPayAmount,
      total_pay: tax.totalPay,
      hourly_rate: hourlyRate,
      income_tax: tax.incomeTax,
      cpp: tax.cpp,
      ei: tax.ei,
      income_tax_rate: tax.incomeTaxRate,
      cpp_rate: tax.cppRate,
      ei_rate: tax.eiRate,
    };

    console.log({timesheetData});
    submitMutation.mutate(timesheetData);
  };

  return {
    form,
    totalHours,
    hourlyRate,
    grossPay,
    onSubmit,
    submitMutation,
    workWeeks,
    existingTimesheets,
    isWeekSubmitted,
    user,
  };
};

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useTimesheetSubmission } from './useTimesheetSubmission';
import { useCompanySettings } from './useCompanySettings';
import { useWorkWeek } from './useWorkWeek';
import { useTimesheetData } from './useTimesheetData';
import { useExistingTimesheets } from './useExistingTimesheets';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

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

export const useTimesheetForm = () => {
  const { user, session } = useAuth();
  const { settings } = useCompanySettings();
  const submitMutation = useTimesheetSubmission();
  const workWeeks = useWorkWeek();
  const { data: existingTimesheets = [] } = useExistingTimesheets();
  
  // Initialize with current week/period
  const [selectedWeek, setSelectedWeek] = useState(() => 
    workWeeks?.currentWeek || null
  );
  
  // Fetch existing timesheet data for the selected week
  const { data: existingTimesheetData } = useTimesheetData({
    userId: user?.id,
    weekStartDate: selectedWeek?.weekStartDateString,
    enabled: !!selectedWeek?.weekStartDateString && !!user?.id
  });

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

  // Update selected week when workWeeks loads
  React.useEffect(() => {
    if (workWeeks?.currentWeek && !selectedWeek) {
      setSelectedWeek(workWeeks.currentWeek);
    }
  }, [workWeeks, selectedWeek]);

  const draftKey = React.useMemo(() => {
    const start = selectedWeek?.weekStartDateString || 'unknown';
    const freq = ((settings as any)?.timesheet_frequency === 'bi-weekly') ? 'bi' : 'wk';
    const uid = user?.id || 'anon';
    return `timesheet:${uid}:${start}:${freq}`;
  }, [user?.id, selectedWeek?.weekStartDateString, settings]);

  // Load existing timesheet data when available
  React.useEffect(() => {
    if (existingTimesheetData) {
      const formData: FormData = {
        jobsiteId: existingTimesheetData.jobsite_id || '',
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
        additionalExpense: existingTimesheetData.additional_expense || 0,
        notes: existingTimesheetData.notes || '',
        tax_included: existingTimesheetData.tax_included || false,
      };

      // Handle bi-weekly data if present
      if (existingTimesheetData.biWeeklyData?.days) {
        existingTimesheetData.biWeeklyData.days.forEach((day: any, index: number) => {
          const dayOfWeek = new Date(day.date).getDay(); // 0=Sun, 1=Mon, etc.
          const isWeek2 = index >= 7;
          const dayFields = ['sundayHours', 'mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 'fridayHours', 'saturdayHours'];
          const fieldName = dayFields[dayOfWeek] + (isWeek2 ? 'Week2' : '');
          (formData as any)[fieldName] = day.hours || 0;
        });
      } else {
        // Regular weekly data
        formData.mondayHours = existingTimesheetData.monday_hours || 0;
        formData.tuesdayHours = existingTimesheetData.tuesday_hours || 0;
        formData.wednesdayHours = existingTimesheetData.wednesday_hours || 0;
        formData.thursdayHours = existingTimesheetData.thursday_hours || 0;
        formData.fridayHours = existingTimesheetData.friday_hours || 0;
        formData.saturdayHours = existingTimesheetData.saturday_hours || 0;
        formData.sundayHours = existingTimesheetData.sunday_hours || 0;
      }

      form.reset(formData);
    } else {
      // Load from localStorage draft if no existing data
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          form.reset(JSON.parse(raw) as any);
        }
      } catch (e) {
        console.warn('Failed to restore draft', e);
      }
    }
  }, [existingTimesheetData, draftKey, form]);

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

  const isWeekSubmitted = selectedWeek ? existingTimesheets.includes(selectedWeek.weekStartDateString) : false;

  React.useEffect(() => {
    const sub = form.watch((values) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(values));
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [form, draftKey]);

  React.useEffect(() => {
    if (submitMutation.isSuccess) {
      try { localStorage.removeItem(draftKey); } catch {}
    }
  }, [submitMutation.isSuccess, draftKey]);

  const onSubmit = (data: FormData) => {
    console.log('📋 Form submission started with data:', data);
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

    // Build optional bi-weekly breakdown payload for notes
    let notesWithBreakdown = data.notes || '';
    if (isBiWeekly && selectedWeek) {
      const days: { date: string; label: string; hours: number }[] = [];
      for (let i = 0; i < 14; i++) {
        const date = new Date(selectedWeek.startDate);
        date.setDate(date.getDate() + i);
        const dayIdx = date.getDay(); // 0-6
        const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const baseFields = ['sundayHours','mondayHours','tuesdayHours','wednesdayHours','thursdayHours','fridayHours','saturdayHours'];
        const week2Suffix = i >= 7 ? 'Week2' : '';
        // Prefer explicit form values to avoid stale data
        const value = form.getValues((baseFields[dayIdx] + week2Suffix) as any) || 0;
        days.push({
          date: date.toISOString().split('T')[0],
          label: `${dayLabels[dayIdx]}`,
          hours: Number(value) || 0,
        });
      }
      const marker = '__biweekly_json__=' + btoa(JSON.stringify({ days }));
      notesWithBreakdown = [notesWithBreakdown?.trim(), marker].filter(Boolean).join('\n');
    }

    const timesheetData = {
      jobsiteId: data.jobsiteId,
      weekStartDate: selectedWeek.weekStartDateString,
      mondayHours: data.mondayHours + (form.getValues('mondayHoursWeek2') || 0),
      tuesdayHours: data.tuesdayHours + (form.getValues('tuesdayHoursWeek2') || 0),
      wednesdayHours: data.wednesdayHours + (form.getValues('wednesdayHoursWeek2') || 0),
      thursdayHours: data.thursdayHours + (form.getValues('thursdayHoursWeek2') || 0),
      fridayHours: data.fridayHours + (form.getValues('fridayHoursWeek2') || 0),
      saturdayHours: data.saturdayHours + (form.getValues('saturdayHoursWeek2') || 0),
      sundayHours: data.sundayHours + (form.getValues('sundayHoursWeek2') || 0),
      hourlyRate: hourlyRate,
      additionalExpense: data.additionalExpense || 0,
      notes: notesWithBreakdown,
      taxIncluded: data.tax_included || false,
    };
    
    console.log('🚀 Submitting timesheet with processed data:', timesheetData);
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
    selectedWeek,
    setSelectedWeek,
    existingTimesheets,
    isWeekSubmitted,
    user,
  };
};

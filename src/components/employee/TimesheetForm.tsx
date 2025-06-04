
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, startOfWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, DollarSign, MapPin, Briefcase, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useJobsites } from '@/hooks/useJobsites';
import { useTimesheetSubmission } from '@/hooks/useTimesheetSubmission';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  jobsiteId: z.string().min(1, 'Please select a jobsite'),
  weekStartDate: z.string().min(1, 'Please select week ending date'),
  mondayHours: z.number().min(0).max(24),
  tuesdayHours: z.number().min(0).max(24),
  wednesdayHours: z.number().min(0).max(24),
  thursdayHours: z.number().min(0).max(24),
  fridayHours: z.number().min(0).max(24),
  saturdayHours: z.number().min(0).max(24),
  sundayHours: z.number().min(0).max(24),
});

type FormData = z.infer<typeof formSchema>;

const TimesheetForm = () => {
  const { user } = useAuth();
  const { data: jobsites = [], isLoading: jobsitesLoading } = useJobsites();
  const submitMutation = useTimesheetSubmission();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobsiteId: '',
      weekStartDate: '',
      mondayHours: 0,
      tuesdayHours: 0,
      wednesdayHours: 0,
      thursdayHours: 0,
      fridayHours: 0,
      saturdayHours: 0,
      sundayHours: 0,
    },
  });

  const watchedValues = form.watch();
  const totalHours = (
    watchedValues.mondayHours + watchedValues.tuesdayHours + 
    watchedValues.wednesdayHours + watchedValues.thursdayHours + 
    watchedValues.fridayHours + watchedValues.saturdayHours + 
    watchedValues.sundayHours
  );

  const hourlyRate = parseFloat(user?.user_metadata?.hourly_rate || '25');
  const grossPay = totalHours * hourlyRate;

  // Filter out jobsites with empty names
  const validJobsites = jobsites.filter(jobsite => jobsite.name && jobsite.name.trim().length > 0);

  const daysOfWeek = [
    { key: 'mondayHours', label: 'Monday' },
    { key: 'tuesdayHours', label: 'Tuesday' },
    { key: 'wednesdayHours', label: 'Wednesday' },
    { key: 'thursdayHours', label: 'Thursday' },
    { key: 'fridayHours', label: 'Friday' },
    { key: 'saturdayHours', label: 'Saturday' },
    { key: 'sundayHours', label: 'Sunday' }
  ];

  const onSubmit = (data: FormData) => {
    if (totalHours === 0) {
      toast({
        title: "No Hours Entered",
        description: "Please enter at least one hour for the week",
        variant: "destructive",
      });
      return;
    }

    // Calculate week start date from the selected week ending date
    const weekEndDate = new Date(data.weekStartDate);
    const weekStart = new Date(weekEndDate);
    weekStart.setDate(weekEndDate.getDate() - 6); // Get Monday (7 days before Sunday)
    
    const timesheetData = {
      jobsiteId: data.jobsiteId,
      weekStartDate: format(weekStart, 'yyyy-MM-dd'),
      mondayHours: data.mondayHours,
      tuesdayHours: data.tuesdayHours,
      wednesdayHours: data.wednesdayHours,
      thursdayHours: data.thursdayHours,
      fridayHours: data.fridayHours,
      saturdayHours: data.saturdayHours,
      sundayHours: data.sundayHours,
      hourlyRate: hourlyRate,
    };
    
    submitMutation.mutate(timesheetData);
    
    // Reset form on successful submission
    if (!submitMutation.isError) {
      form.reset();
    }
  };

  // Generate week ending dates for the select dropdown (next 8 weeks)
  const getWeekEndingDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (7 * i) - today.getDay()); // Get next Sunday
      dates.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'MMM dd, yyyy')
      });
    }
    return dates;
  };

  const weekEndingDates = getWeekEndingDates();

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-6 w-6" />
          <span>Weekly Timesheet</span>
        </CardTitle>
        <p className="text-orange-100">Submit your weekly hours</p>
      </CardHeader>
      
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Job Site and Week Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobsiteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <span>Job Site</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job site" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white z-50">
                        {jobsitesLoading ? (
                          <SelectItem value="loading-placeholder" disabled>Loading jobsites...</SelectItem>
                        ) : validJobsites.length === 0 ? (
                          <SelectItem value="empty-placeholder" disabled>No jobsites available</SelectItem>
                        ) : (
                          validJobsites.map((jobsite) => (
                            <SelectItem key={jobsite.id} value={jobsite.id}>
                              {jobsite.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weekStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span>Week Ending</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select week ending" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white z-50">
                        {weekEndingDates.map((date) => (
                          <SelectItem key={date.value} value={date.value}>
                            {date.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Daily Hours Input */}
            <div className="space-y-4">
              <FormLabel className="text-lg font-semibold">Daily Hours</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {daysOfWeek.map((day) => (
                  <FormField
                    key={day.key}
                    control={form.control}
                    name={day.key as keyof FormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{day.label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            placeholder="0"
                            value={field.value?.toString() || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="text-center"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-slate-600">Total Hours</p>
                <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600">Hourly Rate</p>
                <p className="text-2xl font-bold text-green-600">${hourlyRate.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600">Gross Pay</p>
                <p className="text-2xl font-bold text-orange-600">${grossPay.toFixed(2)}</p>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-3"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Timesheet'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TimesheetForm;

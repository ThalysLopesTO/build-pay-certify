
import React from 'react';
import { Control } from 'react-hook-form';
import { MapPin, Calendar } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobsites } from '@/hooks/useJobsites';

interface JobsiteWeekSelectorProps {
  control: Control<any>;
  weekEndingDates: Array<{ value: string; label: string }>;
}

const JobsiteWeekSelector = ({ control, weekEndingDates }: JobsiteWeekSelectorProps) => {
  const { data: jobsites = [], isLoading: jobsitesLoading } = useJobsites();
  
  // Filter out jobsites with empty names
  const validJobsites = jobsites.filter(jobsite => jobsite.name && jobsite.name.trim().length > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={control}
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
        control={control}
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
  );
};

export default JobsiteWeekSelector;

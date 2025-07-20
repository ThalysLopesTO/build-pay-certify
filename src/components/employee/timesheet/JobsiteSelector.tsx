
import React from 'react';
import { Control } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveJobsites } from '@/hooks/useJobsites';

interface JobsiteSelectorProps {
  control: Control<any>;
  disabled?: boolean;
}

const JobsiteSelector = ({ control, disabled = false }: JobsiteSelectorProps) => {
  const { data: jobsites = [], isLoading: jobsitesLoading } = useActiveJobsites();
  
  // Filter out jobsites with empty names
  const validJobsites = jobsites.filter(jobsite => jobsite.name && jobsite.name.trim().length > 0);

  return (
    <FormField
      control={control}
      name="jobsiteId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-orange-600" />
            <span>Job Site</span>
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
            <FormControl>
              <SelectTrigger className={disabled ? 'bg-gray-100 cursor-not-allowed' : ''}>
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
  );
};

export default JobsiteSelector;

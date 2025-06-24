
import React from 'react';
import { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobsites } from '@/hooks/useJobsites';
import { Building2 } from 'lucide-react';

interface JobsiteSelectorProps {
  control: Control<any>;
}

const JobsiteSelector: React.FC<JobsiteSelectorProps> = ({ control }) => {
  const { data: jobsites = [], isLoading } = useJobsites();

  return (
    <FormField
      control={control}
      name="jobsiteId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Jobsite *</span>
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading jobsites..." : "Select a jobsite"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {jobsites.map((jobsite) => (
                <SelectItem key={jobsite.id} value={jobsite.id}>
                  {jobsite.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default JobsiteSelector;

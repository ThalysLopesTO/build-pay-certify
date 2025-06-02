
import React from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobsites } from '@/hooks/useJobsites';

interface JobsiteSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const JobsiteSelect = ({ value, onValueChange }: JobsiteSelectProps) => {
  const { data: jobsites = [], isLoading: jobsitesLoading, error: jobsitesError } = useJobsites();

  // Debug logging
  console.log('Jobsites data:', jobsites);
  console.log('Jobsites loading:', jobsitesLoading);
  console.log('Jobsites error:', jobsitesError);

  return (
    <FormItem>
      <FormLabel>Jobsite</FormLabel>
      <Select onValueChange={onValueChange} value={value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a jobsite" />
          </SelectTrigger>
        </FormControl>
        <SelectContent className="bg-white z-50">
          {jobsitesLoading ? (
            <SelectItem value="loading" disabled>Loading jobsites...</SelectItem>
          ) : jobsitesError ? (
            <SelectItem value="error" disabled>Error loading jobsites</SelectItem>
          ) : jobsites.length === 0 ? (
            <SelectItem value="empty" disabled>No jobsites available</SelectItem>
          ) : (
            jobsites.map((jobsite) => (
              <SelectItem key={jobsite.id} value={jobsite.id}>
                {jobsite.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  );
};

export default JobsiteSelect;

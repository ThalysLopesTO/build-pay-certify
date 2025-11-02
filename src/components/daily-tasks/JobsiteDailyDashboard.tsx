import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { DateSelectionView } from './DateSelectionView';
import { SingleDateView } from './SingleDateView';

interface JobsiteDailyDashboardProps {
  jobsiteId: string;
  companyId: string;
}

export const JobsiteDailyDashboard: React.FC<JobsiteDailyDashboardProps> = ({
  jobsiteId,
  companyId,
}) => {
  const [searchParams] = useSearchParams();
  const selectedDate = searchParams.get('date');

  // If date is selected, show single date view
  // Otherwise, show date selection view
  if (selectedDate) {
    return (
      <SingleDateView
        jobsiteId={jobsiteId}
        companyId={companyId}
        selectedDate={selectedDate}
      />
    );
  }

  return (
    <DateSelectionView
      jobsiteId={jobsiteId}
      companyId={companyId}
    />
  );
};

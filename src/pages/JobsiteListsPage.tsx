import React from 'react';
import { useParams } from 'react-router-dom';
import { JobsiteDailyLists } from '@/components/daily-tasks/JobsiteDailyLists';

const JobsiteListsPage = () => {
  const { jobsiteId } = useParams<{ jobsiteId: string }>();

  if (!jobsiteId) {
    return <div>Jobsite not found</div>;
  }

  return <JobsiteDailyLists jobsiteId={jobsiteId} />;
};

export default JobsiteListsPage;

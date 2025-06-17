
import React from 'react';
import JobsiteCard from './JobsiteCard';

interface Jobsite {
  id: string;
  name: string;
  address: string;
  starting_date?: string;
  created_at: string;
}

interface JobsiteListProps {
  jobsites: Jobsite[];
  isLoading: boolean;
}

const JobsiteList: React.FC<JobsiteListProps> = ({ jobsites, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading jobsites...
      </div>
    );
  }

  if (jobsites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No jobsites found. Add your first jobsite to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobsites.map((jobsite) => (
        <JobsiteCard key={jobsite.id} jobsite={jobsite} />
      ))}
    </div>
  );
};

export default JobsiteList;

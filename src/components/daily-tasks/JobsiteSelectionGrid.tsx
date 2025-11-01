import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobsiteTaskCard } from './JobsiteTaskCard';
import { Input } from '@/components/ui/input';
import { Search, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Jobsite {
  id: string;
  name: string;
  address: string;
  status: string;
}

interface JobsiteSelectionGridProps {
  jobsites: Jobsite[];
  isLoading: boolean;
}

export const JobsiteSelectionGrid: React.FC<JobsiteSelectionGridProps> = ({
  jobsites,
  isLoading,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredJobsites = jobsites.filter((jobsite) =>
    jobsite.name.toLowerCase().includes(search.toLowerCase()) ||
    jobsite.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleJobsiteClick = (jobsiteId: string) => {
    navigate(`/daily-tasks?jobsiteId=${jobsiteId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobsites..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredJobsites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {search ? 'No jobsites found' : 'No active jobsites'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {search 
              ? 'Try adjusting your search terms'
              : 'Create a jobsite to start managing daily tasks'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobsites.map((jobsite) => (
            <JobsiteTaskCard
              key={jobsite.id}
              jobsite={jobsite}
              onClick={() => handleJobsiteClick(jobsite.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

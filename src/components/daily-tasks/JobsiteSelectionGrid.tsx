import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobsiteTaskCard } from './JobsiteTaskCard';
import { Input } from '@/components/ui/input';
import { Search, Inbox, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

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
    navigate(`/admin/dashboard?tab=daily-tasks&jobsiteId=${jobsiteId}`);
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Building2 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {search ? 'No Jobsites Found' : 'No Active Jobsites'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md text-center">
              {search 
                ? 'Try adjusting your search terms to find the jobsite you\'re looking for.'
                : 'Create a jobsite to start managing daily tasks and organizing your work.'}
            </p>
          </CardContent>
        </Card>
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

import React from 'react';
import { Trash2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';
import JobsiteProgressCard from './JobsiteProgressCard';

interface Jobsite {
  id: string;
  name: string;
  address: string;
  starting_date?: string;
  created_at: string;
}

interface JobsiteCardProps {
  jobsite: Jobsite;
  showProgress?: boolean;
}

const JobsiteCard: React.FC<JobsiteCardProps> = ({ jobsite, showProgress = false }) => {
  const { deleteJobsite } = useJobsiteActions();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${jobsite.name}"? This action cannot be undone.`)) {
      try {
        await deleteJobsite.mutateAsync(jobsite.id);
      } catch (error) {
        console.error('Error deleting jobsite:', error);
      }
    }
  };

  const formatStartingDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // If showProgress is true, use the JobsiteProgressCard
  if (showProgress) {
    return <JobsiteProgressCard jobsite={jobsite} />;
  }

  // Otherwise, show the original simple card
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{jobsite.name}</h3>
            <p className="text-gray-600">{jobsite.address}</p>
            {jobsite.starting_date && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                Starting: {formatStartingDate(jobsite.starting_date)}
              </p>
            )}
            <p className="text-sm text-gray-400">
              Created: {new Date(jobsite.created_at).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteJobsite.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobsiteCard;

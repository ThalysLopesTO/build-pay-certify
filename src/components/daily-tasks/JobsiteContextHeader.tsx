import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Building2, MapPin } from 'lucide-react';

interface JobsiteContextHeaderProps {
  jobsite: {
    id: string;
    name: string;
    address: string;
    status: string;
  } | null;
}

export const JobsiteContextHeader: React.FC<JobsiteContextHeaderProps> = ({ jobsite }) => {
  const navigate = useNavigate();

  if (!jobsite) return null;

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/admin/dashboard?tab=daily-tasks')}
        className="gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Jobsites
      </Button>

      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            {jobsite.name}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{jobsite.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

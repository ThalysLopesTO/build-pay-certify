import React from 'react';
import { Building } from 'lucide-react';

interface JobsiteMobileHeaderProps {
  jobsiteCount: number;
}

const JobsiteMobileHeader: React.FC<JobsiteMobileHeaderProps> = ({ jobsiteCount }) => {
  return (
    <div className="sticky top-0 z-10 bg-background border-b md:hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Jobsites</h1>
            <p className="text-xs text-muted-foreground">{jobsiteCount} total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsiteMobileHeader;

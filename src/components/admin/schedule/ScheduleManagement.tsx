import React, { useState } from 'react';
import { useActiveJobsites } from '@/hooks/useJobsites';
import JobsiteScheduleCard from './JobsiteScheduleCard';
import GanttChartView from './GanttChartView';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const ScheduleManagement = () => {
  const { data: jobsites = [], isLoading } = useActiveJobsites();
  const [selectedJobsiteId, setSelectedJobsiteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedJobsite = jobsites.find(j => j.id === selectedJobsiteId);

  const filteredJobsites = jobsites.filter(jobsite =>
    jobsite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jobsite.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedJobsiteId && selectedJobsite) {
    return (
      <GanttChartView
        jobsite={selectedJobsite}
        onBack={() => setSelectedJobsiteId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Schedule Management</h1>
        <p className="text-muted-foreground">
          View and manage timelines for your jobsites
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobsites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredJobsites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? 'No jobsites found matching your search' : 'No active jobsites'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobsites.map((jobsite) => (
            <JobsiteScheduleCard
              key={jobsite.id}
              jobsite={jobsite}
              onClick={() => setSelectedJobsiteId(jobsite.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;

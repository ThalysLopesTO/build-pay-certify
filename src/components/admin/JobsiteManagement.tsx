
import React, { useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJobsites } from '@/hooks/useJobsites';
import JobsiteForm from './jobsite/JobsiteForm';
import JobsiteList from './jobsite/JobsiteList';

const JobsiteManagement = () => {
  const [isAdding, setIsAdding] = useState(false);
  const { data: jobsites = [], isLoading } = useJobsites();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Jobsite Management</span>
          </CardTitle>
          <Button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Jobsite</span>
          </Button>
        </CardHeader>
        
        <CardContent>
          {isAdding && (
            <JobsiteForm onCancel={() => setIsAdding(false)} />
          )}

          <JobsiteList jobsites={jobsites} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default JobsiteManagement;

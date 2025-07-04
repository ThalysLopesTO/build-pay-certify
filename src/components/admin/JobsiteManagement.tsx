
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building, BarChart3, Package } from 'lucide-react';
import { useJobsites } from '@/hooks/useJobsites';
import JobsiteForm from './jobsite/JobsiteForm';
import JobsiteList from './jobsite/JobsiteList';
import JobsiteCard from './jobsite/JobsiteCard';
import JobsiteDetailedCard from './jobsite/JobsiteDetailedCard';

const JobsiteManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const { data: jobsites = [], isLoading, error } = useJobsites();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading jobsites: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobsite Management</h1>
          <p className="text-gray-600">Manage your company's jobsites and track progress</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Jobsite
        </Button>
      </div>

      {showForm && (
        <JobsiteForm onCancel={() => setShowForm(false)} />
      )}

      <Tabs defaultValue="detailed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Detailed View
          </TabsTrigger>
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Basic View
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Progress Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detailed" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading jobsites...
            </div>
          ) : jobsites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No jobsites found. Add your first jobsite to get started.
            </div>
          ) : (
            jobsites.map((jobsite) => (
              <JobsiteDetailedCard 
                key={jobsite.id} 
                jobsite={jobsite} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Jobsites</CardTitle>
            </CardHeader>
            <CardContent>
              <JobsiteList jobsites={jobsites} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading jobsites...
              </div>
            ) : jobsites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No jobsites found. Add your first jobsite to get started.
              </div>
            ) : (
              jobsites.map((jobsite) => (
                <JobsiteCard 
                  key={jobsite.id} 
                  jobsite={jobsite} 
                  showProgress={true}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobsiteManagement;


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
          <h1 className="text-3xl font-bold text-foreground">Jobsite Management</h1>
          <p className="text-muted-foreground mt-1">Manage your company's jobsites and track progress</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="hover:scale-105 transition-transform">
          <Plus className="h-4 w-4 mr-2" />
          Add Jobsite
        </Button>
      </div>

      {showForm && (
        <JobsiteForm onCancel={() => setShowForm(false)} />
      )}

      <div className="w-full">
        <div className="inline-flex rounded-lg shadow-sm bg-background border p-1">
          <Tabs defaultValue="detailed" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-0 gap-1">
              <TabsTrigger 
                value="detailed" 
                className="flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <Package className="h-4 w-4" />
                Detailed View
              </TabsTrigger>
              <TabsTrigger 
                value="basic" 
                className="flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <Building className="h-4 w-4" />
                Basic View
              </TabsTrigger>
              <TabsTrigger 
                value="progress" 
                className="flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <BarChart3 className="h-4 w-4" />
                Progress Tracking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detailed" className="space-y-6 mt-6">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-pulse">Loading jobsites...</div>
                </div>
              ) : jobsites.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No jobsites found</p>
                  <p className="text-sm">Add your first jobsite to get started</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {jobsites.map((jobsite) => (
                    <JobsiteDetailedCard 
                      key={jobsite.id} 
                      jobsite={jobsite} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="basic" className="space-y-6 mt-6">
              <Card className="shadow-md rounded-2xl border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">All Jobsites</CardTitle>
                </CardHeader>
                <CardContent>
                  <JobsiteList jobsites={jobsites} isLoading={isLoading} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6 mt-6">
              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="animate-pulse">Loading jobsites...</div>
                  </div>
                ) : jobsites.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No jobsites found</p>
                    <p className="text-sm">Add your first jobsite to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {jobsites.map((jobsite) => (
                      <JobsiteCard 
                        key={jobsite.id} 
                        jobsite={jobsite} 
                        showProgress={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default JobsiteManagement;

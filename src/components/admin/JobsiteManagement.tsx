
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building, BarChart3, Package } from 'lucide-react';
import { useActiveJobsites } from '@/hooks/useJobsites';
import JobsiteForm from './jobsite/JobsiteForm';
import JobsiteList from './jobsite/JobsiteList';
import JobsiteCard from './jobsite/JobsiteCard';
import JobsiteDetailedCard from './jobsite/JobsiteDetailedCard';

const JobsiteManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const { data: jobsites = [], isLoading, error } = useActiveJobsites();

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Jobsite Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your company's jobsites and track progress</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)} 
            className="w-full sm:w-auto hover:scale-105 transition-transform"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Jobsite
          </Button>
        </div>

        {showForm && (
          <JobsiteForm onCancel={() => setShowForm(false)} />
        )}

        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center rounded-lg shadow-sm bg-background border p-1 overflow-x-auto">
            <Tabs defaultValue="detailed" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-transparent h-auto p-0 gap-1">
                <TabsTrigger 
                  value="detailed" 
                  className="flex items-center justify-center gap-2 rounded-md px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <Package className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="hidden sm:inline">Detailed View</span>
                  <span className="sm:hidden">Detailed</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="basic" 
                  className="flex items-center justify-center gap-2 rounded-md px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <Building className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="hidden sm:inline">Basic View</span>
                  <span className="sm:hidden">Basic</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="progress" 
                  className="flex items-center justify-center gap-2 rounded-md px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <BarChart3 className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="hidden sm:inline">Progress Tracking</span>
                  <span className="sm:hidden">Progress</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="detailed" className="space-y-4 mt-6">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="animate-pulse text-sm sm:text-base">Loading jobsites...</div>
                  </div>
                ) : jobsites.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-base sm:text-lg font-medium mb-2">No jobsites found</p>
                    <p className="text-xs sm:text-sm">Add your first jobsite to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobsites.map((jobsite) => (
                      <JobsiteDetailedCard 
                        key={jobsite.id} 
                        jobsite={jobsite} 
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="basic" className="space-y-4 mt-6">
                <Card className="shadow-md rounded-2xl border">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl font-semibold">All Jobsites</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <JobsiteList jobsites={jobsites} isLoading={isLoading} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4 mt-6">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="animate-pulse text-sm sm:text-base">Loading jobsites...</div>
                    </div>
                  ) : jobsites.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-base sm:text-lg font-medium mb-2">No jobsites found</p>
                      <p className="text-xs sm:text-sm">Add your first jobsite to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
    </div>
  );
};

export default JobsiteManagement;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompletedJobsites } from '@/hooks/useJobsites';
import JobsiteDetailedCard from './jobsite/JobsiteDetailedCard';

const CompletedJobsites = () => {
  const navigate = useNavigate();
  const { data: completedJobsites = [], isLoading, error } = useCompletedJobsites();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading completed jobsites: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/jobsite-management')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Active
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Completed Jobsites</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                View and manage completed project records
              </p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <Card className="shadow-md rounded-2xl border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <Archive className="h-5 w-5 text-muted-foreground" />
                All Completed Jobsites
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-pulse text-sm sm:text-base">Loading completed jobsites...</div>
                </div>
              ) : completedJobsites.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Archive className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base sm:text-lg font-medium mb-2">No completed jobsites found</p>
                  <p className="text-xs sm:text-sm">Completed jobsites will appear here once marked as finished</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedJobsites.map((jobsite) => (
                    <div key={jobsite.id} className="opacity-80 hover:opacity-100 transition-opacity">
                      <JobsiteDetailedCard 
                        jobsite={jobsite} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompletedJobsites;
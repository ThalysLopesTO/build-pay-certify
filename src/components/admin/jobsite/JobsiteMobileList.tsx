import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Jobsite {
  id: string;
  name: string;
  address: string;
  status: string;
  starting_date?: string;
  created_at: string;
}

interface JobsiteMobileListProps {
  jobsites: Jobsite[];
  isLoading: boolean;
}

const JobsiteMobileList: React.FC<JobsiteMobileListProps> = ({ jobsites, isLoading }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="ml-4 space-y-2">
                  <div className="h-6 w-16 bg-muted rounded"></div>
                  <div className="h-5 w-5 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (jobsites.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-2">No jobsites found</h3>
        <p className="text-muted-foreground text-sm">Try adjusting your filters or add a new jobsite to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobsites.map((jobsite) => (
        <Card key={jobsite.id} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground truncate pr-2">{jobsite.name}</h3>
                  <Badge className={`${getStatusColor(jobsite.status)} text-xs font-medium flex-shrink-0`}>
                    {jobsite.status}
                  </Badge>
                </div>
                
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{jobsite.address}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">
                      {jobsite.starting_date 
                        ? format(new Date(jobsite.starting_date), 'MMM dd, yyyy')
                        : format(new Date(jobsite.created_at), 'MMM dd, yyyy')
                      }
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ID: {jobsite.id.slice(0, 8)}
                  </span>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-3 flex-shrink-0">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default JobsiteMobileList;
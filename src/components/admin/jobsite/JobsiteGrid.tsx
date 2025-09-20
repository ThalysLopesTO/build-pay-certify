import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, MapPin, Calendar, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface Jobsite {
  id: string;
  name: string;
  address: string;
  status: string;
  starting_date?: string;
  created_at: string;
}

interface JobsiteGridProps {
  jobsites: Jobsite[];
  isLoading: boolean;
}

const JobsiteGrid: React.FC<JobsiteGridProps> = ({ jobsites, isLoading }) => {
  const isMobile = useIsMobile();

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
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-muted rounded"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
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
        <p className="text-muted-foreground">Try adjusting your filters or add a new jobsite to get started.</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {jobsites.map((jobsite) => (
        <Card key={jobsite.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold truncate">{jobsite.name}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">ID: {jobsite.id.slice(0, 8)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-2">
                <Badge className={`${getStatusColor(jobsite.status)} text-xs font-medium`}>
                  {jobsite.status}
                </Badge>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground leading-relaxed">{jobsite.address}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {jobsite.starting_date 
                    ? format(new Date(jobsite.starting_date), 'MMM dd, yyyy')
                    : format(new Date(jobsite.created_at), 'MMM dd, yyyy')
                  }
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Created {format(new Date(jobsite.created_at), 'MMM dd')}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default JobsiteGrid;
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { useJobsiteSchedule } from '@/hooks/useJobsiteSchedule';
import { format } from 'date-fns';

interface JobsiteScheduleCardProps {
  jobsite: {
    id: string;
    name: string;
    address?: string;
    starting_date?: string;
    due_date?: string;
    status: string;
  };
  onClick: () => void;
}

const JobsiteScheduleCard: React.FC<JobsiteScheduleCardProps> = ({ jobsite, onClick }) => {
  const { data: scheduleItems = [] } = useJobsiteSchedule(jobsite.id);

  const calculateProgress = () => {
    if (!jobsite.starting_date || !jobsite.due_date) return 0;
    
    const start = new Date(jobsite.starting_date);
    const end = new Date(jobsite.due_date);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.round((elapsed / total) * 100);
  };

  const progress = calculateProgress();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{jobsite.name}</CardTitle>
          <Badge variant={jobsite.status === 'active' ? 'default' : 'secondary'}>
            {jobsite.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobsite.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{jobsite.address}</span>
          </div>
        )}

        {jobsite.starting_date && jobsite.due_date && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {format(new Date(jobsite.starting_date), 'MMM dd')} - {format(new Date(jobsite.due_date), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" />
          <span>{scheduleItems.length} scheduled task{scheduleItems.length !== 1 ? 's' : ''}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobsiteScheduleCard;

import React from 'react';
import { X, MapPin, Calendar, Package, ClipboardList, Globe, BarChart3, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatCoordinates } from '@/services/geocoding';
import { useJobsiteTasks } from '@/hooks/useJobsiteTasks';
import JobsiteMaterialTakeoff from './JobsiteMaterialTakeoff';
import { ChevronDown } from 'lucide-react';

interface Jobsite {
  id: string;
  name: string;
  address: string | null;
  starting_date?: string;
  due_date?: string;
  completion_date?: string;
  created_at: string;
  status?: string;
  latitude?: number;
  longitude?: number;
}

interface JobsiteMobileDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobsite: Jobsite;
}

const JobsiteMobileDetail: React.FC<JobsiteMobileDetailProps> = ({
  open,
  onOpenChange,
  jobsite,
}) => {
  const { data: tasks = [] } = useJobsiteTasks(jobsite.id);
  const [locationOpen, setLocationOpen] = React.useState(false);
  const [tasksOpen, setTasksOpen] = React.useState(false);
  const [materialsOpen, setMaterialsOpen] = React.useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusInfo = () => {
    if (jobsite.status === 'completed') {
      return { label: 'Completed', className: 'bg-green-500/10 text-green-700 border-green-500/20' };
    }
    
    if (!jobsite.due_date) {
      return { label: 'Active', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' };
    }
    
    const dueDate = new Date(jobsite.due_date);
    const today = new Date();
    
    if (dueDate < today) {
      return { label: 'Overdue', className: 'bg-destructive/10 text-destructive border-destructive/20' };
    } else if (dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return { label: 'Due Soon', className: 'bg-orange-500/10 text-orange-700 border-orange-500/20' };
    }
    
    return { label: 'Active', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' };
  };

  const statusInfo = getStatusInfo();
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg">{jobsite.name}</DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6 space-y-4">
          {/* Overview Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Overview
            </h3>
            <div className="space-y-3 pl-6">
              <div>
                <Badge variant="outline" className={statusInfo.className}>
                  {statusInfo.label}
                </Badge>
              </div>
              {jobsite.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{jobsite.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Started: {formatDate(jobsite.starting_date)}</span>
              </div>
              {jobsite.due_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Due: {formatDate(jobsite.due_date)}</span>
                </div>
              )}
              {jobsite.completion_date && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                  <span>Completed: {formatDate(jobsite.completion_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location Details (Collapsible) */}
          {(jobsite.latitude && jobsite.longitude) && (
            <Collapsible open={locationOpen} onOpenChange={setLocationOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between py-2">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Location Details
                  </h3>
                  <ChevronDown className={`h-4 w-4 transition-transform ${locationOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-2">
                <div className="text-sm text-muted-foreground">
                  <p>Coordinates: {formatCoordinates(jobsite.latitude, jobsite.longitude)}</p>
                  <p className="text-xs mt-1">Latitude: {jobsite.latitude}</p>
                  <p className="text-xs">Longitude: {jobsite.longitude}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Tasks Section (Collapsible) */}
          <Collapsible open={tasksOpen} onOpenChange={setTasksOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between py-2">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Tasks ({completedTasks}/{totalTasks})
                </h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${tasksOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 space-y-3">
              {totalTasks > 0 ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium">{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {completedTasks} of {totalTasks} tasks completed
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No tasks assigned yet</p>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Material Takeoff (Collapsible) */}
          <Collapsible open={materialsOpen} onOpenChange={setMaterialsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between py-2">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Material Takeoff
                </h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${materialsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-6">
                <JobsiteMaterialTakeoff jobsiteId={jobsite.id} jobsiteName={jobsite.name} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default JobsiteMobileDetail;

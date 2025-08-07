import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, MapPin, BarChart3, Package, ClipboardList, CheckCircle, RotateCcw, Edit, Globe, RefreshCw } from 'lucide-react';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';
import { useJobsiteTasks } from '@/hooks/useJobsiteTasks';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCoordinates } from '@/services/geocoding';
import JobsiteTaskCard from './JobsiteTaskCard';
import JobsiteMaterialTakeoff from './JobsiteMaterialTakeoff';
import JobsiteEditModal from './JobsiteEditModal';
import EditJobsiteDialog from './EditJobsiteDialog';

interface Jobsite {
  id: string;
  name: string;
  address: string;
  starting_date?: string;
  due_date?: string;
  created_at: string;
  status?: string;
  completion_date?: string;
  latitude?: number;
  longitude?: number;
}

interface JobsiteDetailedCardProps {
  jobsite: Jobsite;
}

const JobsiteDetailedCard: React.FC<JobsiteDetailedCardProps> = ({ jobsite }) => {
  const { deleteJobsite, markJobsiteCompleted, reactivateJobsite } = useJobsiteActions();
  const { data: tasks = [], isLoading: tasksLoading } = useJobsiteTasks(jobsite.id);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${jobsite.name}"? This action cannot be undone.`)) {
      try {
        await deleteJobsite.mutateAsync(jobsite.id);
      } catch (error) {
        console.error('Error deleting jobsite:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getJobsiteStatus = () => {
    if (jobsite.status === 'completed') {
      return { label: 'Completed', variant: 'outline' as const };
    }
    
    if (!jobsite.due_date) return { label: 'Active', variant: 'secondary' as const };
    
    const dueDate = new Date(jobsite.due_date);
    const today = new Date();
    
    if (dueDate < today) {
      return { label: 'Overdue', variant: 'destructive' as const };
    } else if (dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return { label: 'Due Soon', variant: 'secondary' as const };
    } else {
      return { label: 'Active', variant: 'secondary' as const };
    }
  };

  const handleCompleteJobsite = async () => {
    try {
      await markJobsiteCompleted.mutateAsync(jobsite.id);
      setShowCompleteDialog(false);
    } catch (error) {
      console.error('Error completing jobsite:', error);
    }
  };

  const handleReactivateJobsite = async () => {
    try {
      await reactivateJobsite.mutateAsync(jobsite.id);
      setShowReactivateDialog(false);
    } catch (error) {
      console.error('Error reactivating jobsite:', error);
    }
  };

  const status = getJobsiteStatus();
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="shadow-md bg-background rounded-2xl border hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <CardTitle className="text-xl font-semibold">{jobsite.name}</CardTitle>
              <Badge 
                variant={status.variant}
                className="text-xs px-2 py-1"
              >
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                ID: {jobsite.id.slice(0, 8)}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <p className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                {jobsite.address}
              </p>
              {jobsite.starting_date && (
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Started: {formatDate(jobsite.starting_date)}
                </p>
              )}
              {jobsite.due_date && (
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Due: {formatDate(jobsite.due_date)}
                </p>
              )}
              {jobsite.completion_date && (
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Completed: {formatDate(jobsite.completion_date)}
                </p>
              )}
              <p className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                Progress: {progressPercentage.toFixed(0)}% ({completedTasks}/{totalTasks} tasks)
              </p>
              {jobsite.latitude !== undefined && jobsite.longitude !== undefined && (
                <p className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-primary" />
                  Coordinates: {formatCoordinates(jobsite.latitude, jobsite.longitude)}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-700 p-2 rounded-full"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {jobsite.status === 'completed' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReactivateDialog(true)}
                disabled={reactivateJobsite.isPending}
                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 p-2 rounded-full"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompleteDialog(true)}
                disabled={markJobsiteCompleted.isPending}
                className="text-green-600 hover:bg-green-50 hover:text-green-700 p-2 rounded-full"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteJobsite.isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive p-2 rounded-full"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Tabs defaultValue="materials" className="col-span-3">
            <TabsList className="grid w-full grid-cols-2 bg-muted/30 rounded-xl h-auto p-1">
              <TabsTrigger 
                value="materials" 
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-background data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Package className="h-4 w-4" />
                Material Takeoff
              </TabsTrigger>
              <TabsTrigger 
                value="tasks" 
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-background data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <ClipboardList className="h-4 w-4" />
                Tasks ({totalTasks})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="mt-6">
              <div className="rounded-xl bg-muted/20 border p-4">
                <JobsiteMaterialTakeoff 
                  jobsiteId={jobsite.id} 
                  jobsiteName={jobsite.name} 
                />
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <div className="space-y-3">
                {tasksLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-pulse">Loading tasks...</div>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm italic">No tasks created for this jobsite yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {tasks.map((task) => (
                      <JobsiteTaskCard key={task.id} task={task} isAdmin={true} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>

      <ConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        title="Mark Jobsite as Completed"
        description={`Are you sure you want to mark "${jobsite.name}" as completed? This will remove it from active jobsite lists.`}
        confirmText="Mark as Completed"
        onConfirm={handleCompleteJobsite}
      />

      <ConfirmDialog
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
        title="Reactivate Jobsite"
        description={`Are you sure you want to reactivate "${jobsite.name}"? This will make it available in active jobsite lists again.`}
        confirmText="Reactivate"
        onConfirm={handleReactivateJobsite}
      />

      <JobsiteEditModal
        jobsite={jobsite}
        open={showEditModal}
        onOpenChange={setShowEditModal}
      />

      <EditJobsiteDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        jobsite={{
          ...jobsite,
          status: jobsite.status || 'active'
        }}
      />
    </Card>
  );
};

export default JobsiteDetailedCard;
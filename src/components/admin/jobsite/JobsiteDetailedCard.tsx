import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, MapPin, BarChart3, Package, ClipboardList, CheckCircle, RotateCcw, Edit, Globe, RefreshCw, Clock } from 'lucide-react';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';
import { useJobsiteTasks } from '@/hooks/useJobsiteTasks';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCoordinates } from '@/services/geocoding';
import JobsiteTaskCard from './JobsiteTaskCard';
import JobsiteMaterialTakeoff from './JobsiteMaterialTakeoff';
import JobsiteEditModal from './JobsiteEditModal';
import EditJobsiteDialog from './EditJobsiteDialog';
import JobsiteDeleteDialog from './JobsiteDeleteDialog';
import { JobsiteTaskTab } from '../tasks/JobsiteTaskTab';
import JobsiteTimeRules from './JobsiteTimeRules';

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
  const { deleteJobsite, archiveJobsite, cascadeDeleteJobsite, markJobsiteCompleted, reactivateJobsite } = useJobsiteActions();
  const { data: tasks = [], isLoading: tasksLoading } = useJobsiteTasks(jobsite.id);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = (archiveInstead: boolean) => {
    if (archiveInstead) {
      archiveJobsite.mutateAsync(jobsite.id);
    } else {
      deleteJobsite.mutateAsync(jobsite.id);
    }
    setShowDeleteDialog(false);
  };

  const handleCascadeDelete = () => {
    cascadeDeleteJobsite.mutateAsync(jobsite.id);
    setShowDeleteDialog(false);
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

  // ── urgency helpers ──────────────────────────────────────────────────────────
  const getDueInfo = () => {
    if (jobsite.status === 'completed' || !jobsite.due_date) return null;
    const diffDays = Math.ceil(
      (new Date(jobsite.due_date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      86_400_000
    );
    if (diffDays < 0)  return { label: `${Math.abs(diffDays)}d overdue`,  style: 'text-red-700 bg-red-100 border-red-200' };
    if (diffDays === 0) return { label: 'Due today',                        style: 'text-red-700 bg-red-100 border-red-200' };
    if (diffDays <= 7)  return { label: `${diffDays}d left`,                style: 'text-amber-700 bg-amber-100 border-amber-200' };
    return { label: `${diffDays}d left`, style: 'text-slate-600 bg-slate-100 border-slate-200' };
  };

  const getCardAccent = () => {
    if (jobsite.status === 'completed') return 'border-l-4 border-l-emerald-400';
    if (!jobsite.due_date) return 'border-l-4 border-l-blue-400';
    const diffDays = Math.ceil(
      (new Date(jobsite.due_date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      86_400_000
    );
    if (diffDays < 0)  return 'border-l-4 border-l-red-500';
    if (diffDays <= 7) return 'border-l-4 border-l-amber-400';
    return 'border-l-4 border-l-blue-400';
  };

  const dueInfo = getDueInfo();

  return (
    <Card className={`shadow-md bg-background rounded-2xl border hover:shadow-lg transition-shadow ${getCardAccent()}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <CardTitle className="text-lg sm:text-xl font-semibold">{jobsite.name}</CardTitle>
              <Badge variant={status.variant} className="text-xs px-2 py-1">
                {status.label}
              </Badge>
              {dueInfo && (
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-semibold ${dueInfo.style}`}>
                  <Clock className="h-3 w-3" />
                  {dueInfo.label}
                </span>
              )}
            </div>

            {/* Task progress bar */}
            {totalTasks > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Task progress
                  </span>
                  <span className="font-semibold tabular-nums">
                    {completedTasks}/{totalTasks} &nbsp;·&nbsp; {progressPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPercentage === 100
                        ? 'bg-emerald-500'
                        : progressPercentage >= 50
                        ? 'bg-blue-500'
                        : 'bg-orange-400'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <p className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                <span className="truncate">{jobsite.address}</span>
              </p>
              {jobsite.starting_date && (
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                  Started: {formatDate(jobsite.starting_date)}
                </p>
              )}
              {jobsite.due_date && (
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                  Due: {formatDate(jobsite.due_date)}
                </p>
              )}
              {jobsite.completion_date && (
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                  Completed: {formatDate(jobsite.completion_date)}
                </p>
              )}
              {jobsite.latitude !== undefined && jobsite.longitude !== undefined && (
                <p className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                  <span className="truncate">Coordinates: {formatCoordinates(jobsite.latitude, jobsite.longitude)}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 sm:flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-700 h-9 w-9 p-0 rounded-full"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {jobsite.status === 'completed' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReactivateDialog(true)}
                disabled={reactivateJobsite.isPending}
                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-9 w-9 p-0 rounded-full"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompleteDialog(true)}
                disabled={markJobsiteCompleted.isPending}
                className="text-green-600 hover:bg-green-50 hover:text-green-700 h-9 w-9 p-0 rounded-full"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteJobsite.isPending || archiveJobsite.isPending || cascadeDeleteJobsite.isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 w-9 p-0 rounded-full"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Tabs defaultValue="materials" className="col-span-3">
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl h-auto p-1.5 shadow-inner">
              <TabsTrigger 
                value="materials" 
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all hover:bg-background/80 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-border/50"
              >
                <Package className="h-4 w-4" />
                <span className="font-semibold">Material Takeoff</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tasks" 
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all hover:bg-background/80 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-border/50"
              >
                <ClipboardList className="h-4 w-4" />
                <span className="font-semibold">Tasks</span>
                <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold min-w-[20px] text-center">
                  {totalTasks}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="time-rules" 
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all hover:bg-background/80 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-border/50"
              >
                <Clock className="h-4 w-4" />
                <span className="font-semibold">Time Rules</span>
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
              <div className="rounded-xl bg-muted/20 border p-4">
                <JobsiteTaskTab jobsiteId={jobsite.id} isAdmin={true} />
              </div>
            </TabsContent>

            <TabsContent value="time-rules" className="mt-6">
              <div className="rounded-xl bg-muted/20 border p-4">
                <JobsiteTimeRules jobsiteId={jobsite.id} />
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

      <JobsiteDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        jobsite={jobsite}
        onConfirmDelete={handleDelete}
        onConfirmCascade={handleCascadeDelete}
        isDeleting={deleteJobsite.isPending || archiveJobsite.isPending || cascadeDeleteJobsite.isPending}
      />
    </Card>
  );
};

export default JobsiteDetailedCard;
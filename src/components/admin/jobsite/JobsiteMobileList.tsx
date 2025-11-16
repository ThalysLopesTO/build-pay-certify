import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';
import JobsiteMobileCard from './JobsiteMobileCard';
import JobsiteMobileActions from './JobsiteMobileActions';
import JobsiteMobileDetail from './JobsiteMobileDetail';
import JobsiteDeleteDialog from './JobsiteDeleteDialog';
import EditJobsiteDialog from './EditJobsiteDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';
import { useJobsiteTasks } from '@/hooks/useJobsiteTasks';

interface Jobsite {
  id: string;
  name: string;
  address: string | null;
  status?: string;
  starting_date?: string;
  due_date?: string;
  completion_date?: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

interface JobsiteMobileListProps {
  jobsites: Jobsite[];
  isLoading: boolean;
}

const JobsiteMobileList: React.FC<JobsiteMobileListProps> = ({ jobsites, isLoading }) => {
  const [selectedJobsite, setSelectedJobsite] = useState<Jobsite | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  
  const { markJobsiteCompleted, reactivateJobsite, deleteJobsite, archiveJobsite, cascadeDeleteJobsite } = useJobsiteActions();

  const handleTap = (jobsite: Jobsite) => {
    setSelectedJobsite(jobsite);
    setDetailOpen(true);
  };

  const handleAction = (jobsite: Jobsite) => {
    setSelectedJobsite(jobsite);
    setActionsOpen(true);
  };

  const handleViewDetails = () => {
    setActionsOpen(false);
    setDetailOpen(true);
  };

  const handleEdit = () => {
    setActionsOpen(false);
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    setActionsOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = (archiveInstead: boolean) => {
    if (selectedJobsite) {
      if (archiveInstead) {
        archiveJobsite.mutateAsync(selectedJobsite.id);
      } else {
        deleteJobsite.mutateAsync(selectedJobsite.id);
      }
      setDeleteDialogOpen(false);
    }
  };

  const handleCascadeDelete = () => {
    if (selectedJobsite) {
      cascadeDeleteJobsite.mutateAsync(selectedJobsite.id);
      setDeleteDialogOpen(false);
    }
  };

  const handleComplete = async () => {
    if (selectedJobsite) {
      await markJobsiteCompleted.mutateAsync(selectedJobsite.id);
      setCompleteDialogOpen(false);
      setActionsOpen(false);
    }
  };

  const handleReactivate = async () => {
    if (selectedJobsite) {
      await reactivateJobsite.mutateAsync(selectedJobsite.id);
      setReactivateDialogOpen(false);
      setActionsOpen(false);
    }
  };

  // Wrapper component to fetch task stats for each jobsite
  const JobsiteCardWithStats = ({ jobsite }: { jobsite: Jobsite }) => {
    const { data: tasks = [] } = useJobsiteTasks(jobsite.id);
    const completed = tasks.filter(task => task.status === 'completed').length;
    const total = tasks.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return (
      <JobsiteMobileCard
        jobsite={jobsite}
        taskStats={total > 0 ? { completed, total, percentage } : undefined}
        onTap={() => handleTap(jobsite)}
        onAction={() => handleAction(jobsite)}
      />
    );
  };

  return (
    <>
      <div className="space-y-3 pb-20">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : jobsites.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No jobsites found</p>
            </CardContent>
          </Card>
        ) : (
          jobsites.map((jobsite) => (
            <JobsiteCardWithStats key={jobsite.id} jobsite={jobsite} />
          ))
        )}
      </div>

      {/* Action Sheet */}
      {selectedJobsite && (
        <>
          <JobsiteMobileActions
            open={actionsOpen}
            onOpenChange={setActionsOpen}
            jobsite={selectedJobsite}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onComplete={() => setCompleteDialogOpen(true)}
            onReactivate={() => setReactivateDialogOpen(true)}
            onDelete={handleDelete}
          />

          <JobsiteMobileDetail
            open={detailOpen}
            onOpenChange={setDetailOpen}
            jobsite={selectedJobsite}
          />

          <JobsiteDeleteDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            jobsite={{ id: selectedJobsite.id, name: selectedJobsite.name }}
            onConfirmDelete={handleConfirmDelete}
            onConfirmCascade={handleCascadeDelete}
            isDeleting={deleteJobsite.isPending || cascadeDeleteJobsite.isPending || archiveJobsite.isPending}
          />

          <EditJobsiteDialog
            isOpen={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            jobsite={{ ...selectedJobsite, address: selectedJobsite.address || '', status: selectedJobsite.status || 'active' }}
          />

          <ConfirmDialog
            open={completeDialogOpen}
            onOpenChange={setCompleteDialogOpen}
            onConfirm={handleComplete}
            title="Mark Jobsite as Complete?"
            description={`Are you sure you want to mark "${selectedJobsite.name}" as completed? This action can be undone.`}
            confirmText="Mark Complete"
          />

          <ConfirmDialog
            open={reactivateDialogOpen}
            onOpenChange={setReactivateDialogOpen}
            onConfirm={handleReactivate}
            title="Reactivate Jobsite?"
            description={`Are you sure you want to reactivate "${selectedJobsite.name}"?`}
            confirmText="Reactivate"
          />
        </>
      )}
    </>
  );
};

export default JobsiteMobileList;

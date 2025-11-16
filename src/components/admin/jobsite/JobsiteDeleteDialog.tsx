import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Database, Clock, Package, ClipboardList, Archive, X } from 'lucide-react';
import { useJobsiteDependencies } from '@/hooks/useJobsiteDependencies';
import { Skeleton } from '@/components/ui/skeleton';

interface JobsiteDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobsite: {
    id: string;
    name: string;
  };
  onConfirmDelete: (archiveInstead: boolean) => void;
  onConfirmCascade: () => void;
  isDeleting: boolean;
}

const JobsiteDeleteDialog: React.FC<JobsiteDeleteDialogProps> = ({
  open,
  onOpenChange,
  jobsite,
  onConfirmDelete,
  onConfirmCascade,
  isDeleting,
}) => {
  const { data: dependencies, isLoading } = useJobsiteDependencies(jobsite.id);
  const [confirmCascade, setConfirmCascade] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'delete' | 'archive' | 'cascade'>('archive');

  const hasDependencies = dependencies && Object.values(dependencies).some(count => count > 0);
  const totalDependencies = dependencies ? Object.values(dependencies).reduce((sum, count) => sum + count, 0) : 0;

  const dependencyCategories = [
    { key: 'materialRequests', label: 'Material Requests', icon: Package, color: 'bg-blue-500' },
    { key: 'timesheets', label: 'Daily Timesheets', icon: Clock, color: 'bg-green-500' },
    { key: 'weeklyTimesheets', label: 'Weekly Timesheets', icon: Clock, color: 'bg-green-600' },
    { key: 'inventory', label: 'Equipment/Inventory', icon: Package, color: 'bg-orange-500' },
    { key: 'attentionReports', label: 'Attention Reports', icon: AlertTriangle, color: 'bg-red-500' },
    { key: 'dailyReports', label: 'Daily Reports', icon: ClipboardList, color: 'bg-purple-500' },
    { key: 'missedPunchRequests', label: 'Missed Punch Requests', icon: Clock, color: 'bg-yellow-500' },
    { key: 'materialTakeoffNotes', label: 'Material Takeoff Notes', icon: ClipboardList, color: 'bg-indigo-500' },
    { key: 'jobsiteForemen', label: 'Foreman Assignments', icon: Database, color: 'bg-gray-500' },
    { key: 'jobsiteTasks', label: 'Tasks', icon: ClipboardList, color: 'bg-cyan-500' },
    { key: 'invoices', label: 'Invoices', icon: Database, color: 'bg-emerald-500' },
    { key: 'auditLogs', label: 'Audit Logs', icon: Database, color: 'bg-slate-500' },
  ];

  const handleConfirm = () => {
    if (selectedAction === 'cascade') {
      onConfirmCascade();
    } else {
      onConfirmDelete(selectedAction === 'archive');
    }
  };

  const isConfirmDisabled = () => {
    if (selectedAction === 'archive') return !confirmArchive;
    if (selectedAction === 'cascade') return !confirmCascade;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Jobsite: {jobsite.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : hasDependencies ? (
            <>
              <Alert className="border-destructive/50 bg-destructive/5">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This jobsite has <strong>{totalDependencies}</strong> associated records that must be handled before deletion.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Associated Records:</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {dependencyCategories
                    .filter(cat => dependencies[cat.key as keyof typeof dependencies] > 0)
                    .map(({ key, label, icon: Icon, color }) => (
                      <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                        <div className={`p-1 rounded ${color}`}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm flex-1">{label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {dependencies[key as keyof typeof dependencies]}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-sm">Choose an action:</h4>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                    <input
                      type="radio"
                      name="action"
                      value="archive"
                      checked={selectedAction === 'archive'}
                      onChange={(e) => setSelectedAction(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Archive className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">Archive Jobsite (Recommended)</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mark the jobsite as archived instead of deleting. Preserves all historical data and relationships.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                    <input
                      type="radio"
                      name="action"
                      value="cascade"
                      checked={selectedAction === 'cascade'}
                      onChange={(e) => setSelectedAction(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <X className="h-4 w-4 text-destructive" />
                        <span className="font-medium text-sm">Cascade Delete (Permanent)</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Permanently delete the jobsite and all associated records. This action cannot be undone.
                      </p>
                    </div>
                  </label>
                </div>

                {selectedAction === 'archive' && (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="confirm-archive" 
                      checked={confirmArchive}
                      onCheckedChange={(checked) => setConfirmArchive(checked === true)}
                    />
                    <label htmlFor="confirm-archive" className="text-sm">
                      I understand this will archive the jobsite and hide it from active lists
                    </label>
                  </div>
                )}

                {selectedAction === 'cascade' && (
                  <div className="space-y-2 pt-2">
                    <Alert className="border-destructive bg-destructive/5">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Warning:</strong> This will permanently delete {totalDependencies} associated records across {dependencyCategories.filter(cat => dependencies[cat.key as keyof typeof dependencies] > 0).length} different categories.
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="confirm-cascade" 
                        checked={confirmCascade}
                        onCheckedChange={(checked) => setConfirmCascade(checked === true)}
                      />
                      <label htmlFor="confirm-cascade" className="text-sm">
                        I understand this will permanently delete all data and cannot be undone
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Alert className="border-green-500/50 bg-green-500/5">
                <AlertTriangle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  This jobsite has no associated records and can be safely deleted.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-sm">Choose an action:</h4>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                    <input
                      type="radio"
                      name="action"
                      value="delete"
                      checked={selectedAction === 'delete'}
                      onChange={(e) => setSelectedAction(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <X className="h-4 w-4 text-destructive" />
                        <span className="font-medium text-sm">Delete Jobsite</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Permanently remove this jobsite from the system.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                    <input
                      type="radio"
                      name="action"
                      value="archive"
                      checked={selectedAction === 'archive'}
                      onChange={(e) => setSelectedAction(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Archive className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">Archive Jobsite (Safer)</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mark as archived instead. Can be restored later if needed.
                      </p>
                    </div>
                  </label>
                </div>

                {selectedAction === 'archive' && (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="confirm-archive" 
                      checked={confirmArchive}
                      onCheckedChange={(checked) => setConfirmArchive(checked === true)}
                    />
                    <label htmlFor="confirm-archive" className="text-sm">
                      I understand this will archive the jobsite and hide it from active lists
                    </label>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant={selectedAction === 'cascade' ? 'destructive' : selectedAction === 'archive' ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={isConfirmDisabled() || isDeleting}
          >
            {isDeleting ? 'Processing...' : selectedAction === 'archive' ? 'Archive Jobsite' : selectedAction === 'cascade' ? 'Delete Everything' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobsiteDeleteDialog;
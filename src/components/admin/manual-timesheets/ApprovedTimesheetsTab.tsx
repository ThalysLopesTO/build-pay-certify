import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
// (Badge already imported above)
import {
  Folder,
  FolderPlus,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  Eye,
  FileDown,
  X,
  Undo2,
  Check,
  XCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTimesheetFolders, useFolderItems, type TimesheetFolder } from '@/hooks/useTimesheetFolders';
import { formatDateLong } from '@/utils/manualTimesheetDays';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { generateManualTimesheetPDF } from '@/utils/manualTimesheetPDF';
import { ManualTimesheetViewModal } from './ManualTimesheetViewModal';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import type { ManualTimesheet } from '@/hooks/useManualTimesheets';

const formatCurrency = (n: number) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const StatusBadge: React.FC<{ ts: ManualTimesheet }> = ({ ts }) => {
  const status = ts.approval_status ?? 'pending';
  if (status === 'approved') {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
          <CheckCircle2 className="h-3 w-3" /> Approved
        </Badge>
        {ts.approved_by_name && (
          <span className="text-[10px] text-muted-foreground">
            by {ts.approved_by_name}
            {ts.approved_at && ` • ${new Date(ts.approved_at).toLocaleString()}`}
          </span>
        )}
      </div>
    );
  }
  if (status === 'declined') {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 gap-1">
          <XCircle className="h-3 w-3" /> Declined
        </Badge>
        {ts.approved_by_name && (
          <span className="text-[10px] text-muted-foreground">
            by {ts.approved_by_name}
            {ts.approved_at && ` • ${new Date(ts.approved_at).toLocaleString()}`}
          </span>
        )}
      </div>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
};

const ApprovalDialog: React.FC<{
  open: boolean;
  onOpenChange: (o: boolean) => void;
  decision: 'approved' | 'declined' | null;
  timesheet: ManualTimesheet | null;
  onConfirm: (comment: string) => Promise<void> | void;
  pending: boolean;
}> = ({ open, onOpenChange, decision, timesheet, onConfirm, pending }) => {
  const [comment, setComment] = useState('');
  React.useEffect(() => {
    if (open) setComment('');
  }, [open]);

  const isDecline = decision === 'declined';
  const canSubmit = isDecline ? comment.trim().length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isDecline ? 'Decline timesheet' : 'Approve timesheet'}
          </DialogTitle>
          <DialogDescription>
            {timesheet ? `${timesheet.employee_name} — ${timesheet.project_name}` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-sm">
            Comment {isDecline ? <span className="text-destructive">*</span> : '(optional)'}
          </Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={isDecline ? 'Reason for declining…' : 'Add a note (optional)'}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => onConfirm(comment)}
            disabled={!canSubmit || pending}
            className={isDecline ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isDecline ? 'Decline' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FolderDetail: React.FC<{ folder: TimesheetFolder; onBack: () => void }> = ({ folder, onBack }) => {
  const { list, removeItem } = useFolderItems(folder.id);
  const { approveTimesheet } = useTimesheetFolders();
  const { logoUrl } = useCompanyLogo();
  const { settings } = useCompanySettings();
  const { user } = useAuth();
  const [viewing, setViewing] = useState<ManualTimesheet | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<{ ts: ManualTimesheet; decision: 'approved' | 'declined' } | null>(null);
  const [moveBackTarget, setMoveBackTarget] = useState<ManualTimesheet | null>(null);

  const items = list.data ?? [];
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const handleDownload = async (ts: ManualTimesheet) => {
    setDownloadingId(ts.id);
    try {
      await generateManualTimesheetPDF(ts, {
        companyName: settings?.company_name ?? 'Company',
        logoUrl,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmAction = async (comment: string) => {
    if (!actionTarget) return;
    await approveTimesheet.mutateAsync({
      timesheetId: actionTarget.ts.id,
      decision: actionTarget.decision,
      comment,
    });
    setActionTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to folders
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: folder.color ? `${folder.color}20` : 'hsl(var(--primary)/0.1)' }}
          >
            <Folder
              className="h-5 w-5"
              style={{ color: folder.color || 'hsl(var(--primary))' }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight">{folder.name}</h3>
            {folder.description && (
              <p className="text-sm text-muted-foreground">{folder.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {items.length} timesheet{items.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </Card>

      {list.isLoading ? (
        <Card className="p-10 text-center">
          <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          This folder is empty. Move timesheets here from the All Timesheets tab.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Pay Period</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
                <TableHead className="text-right">Total Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((ts) => (
                <TableRow key={ts.id}>
                  <TableCell className="font-medium">
                    <div className="leading-tight">
                      <div>{ts.employee_name}</div>
                      {ts.employee_role && (
                        <div className="text-xs text-muted-foreground font-normal">{ts.employee_role}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{ts.project_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateLong(ts.pay_period_start)} – {formatDateLong(ts.pay_period_end)}
                  </TableCell>
                  <TableCell className="text-right">{Number(ts.total_hours).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(ts.total_payment)}</TableCell>
                  <TableCell>
                    <StatusBadge ts={ts} />
                    {ts.approval_comment && (
                      <div className="text-[11px] text-muted-foreground italic mt-1 max-w-[220px] truncate" title={ts.approval_comment}>
                        “{ts.approval_comment}”
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {isAdmin && ts.approval_status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-700 hover:text-green-800 hover:bg-green-50"
                          onClick={() => setActionTarget({ ts, decision: 'approved' })}
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && ts.approval_status !== 'declined' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-700 hover:text-red-800 hover:bg-red-50"
                          onClick={() => setActionTarget({ ts, decision: 'declined' })}
                          title="Decline"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setViewing(ts)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(ts)}
                        disabled={downloadingId === ts.id}
                      >
                        {downloadingId === ts.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem.mutate(ts.id)}
                        title="Remove from folder"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {viewing && (
        <ManualTimesheetViewModal
          timesheet={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      <ApprovalDialog
        open={!!actionTarget}
        onOpenChange={(o) => !o && setActionTarget(null)}
        decision={actionTarget?.decision ?? null}
        timesheet={actionTarget?.ts ?? null}
        onConfirm={handleConfirmAction}
        pending={approveTimesheet.isPending}
      />
    </div>
  );
};

const FolderFormDialog: React.FC<{
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: TimesheetFolder | null;
}> = ({ open, onOpenChange, initial }) => {
  const { create, rename } = useTimesheetFolders();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? '');

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setColor(initial?.color ?? '');
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (initial) {
      await rename.mutateAsync({
        id: initial.id,
        name: name.trim(),
        description: description.trim() || undefined,
        color: color || undefined,
      });
    } else {
      await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        color: color || undefined,
      });
    }
    onOpenChange(false);
  };

  const pending = create.isPending || rename.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit folder' : 'New folder'}</DialogTitle>
          <DialogDescription>
            Folders help you group timesheets ahead of approval.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Week of Apr 28" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Color (optional)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color || '#3b82f6'}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 rounded border border-input cursor-pointer"
              />
              {color && (
                <Button variant="ghost" size="sm" onClick={() => setColor('')}>Clear</Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || pending}>
            {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {initial ? 'Save' : 'Create folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ApprovedTimesheetsTab: React.FC = () => {
  const { list, remove } = useTimesheetFolders();
  const [openFolder, setOpenFolder] = useState<TimesheetFolder | null>(null);
  const [editing, setEditing] = useState<TimesheetFolder | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<TimesheetFolder | null>(null);

  const folders = list.data ?? [];

  if (openFolder) {
    // Refresh folder reference if list updated
    const fresh = folders.find((f) => f.id === openFolder.id) ?? openFolder;
    return <FolderDetail folder={fresh} onBack={() => setOpenFolder(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Approval Folders</h3>
          <p className="text-sm text-muted-foreground">
            Organize timesheets into folders before approval.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <FolderPlus className="h-4 w-4" /> New Folder
        </Button>
      </div>

      {list.isLoading ? (
        <Card className="p-10 text-center">
          <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
        </Card>
      ) : folders.length === 0 ? (
        <Card className="p-10 text-center bg-muted/30 border-dashed">
          <Folder className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <h3 className="font-semibold mb-1">No folders yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a folder to start organizing timesheets for approval.
          </p>
          <Button onClick={() => setCreating(true)} className="gap-2">
            <FolderPlus className="h-4 w-4" /> Create your first folder
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {folders.map((f) => (
            <Card key={f.id} className="p-4 hover:shadow-md transition cursor-pointer group" onClick={() => setOpenFolder(f)}>
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: f.color ? `${f.color}20` : 'hsl(var(--primary)/0.1)' }}
                >
                  <Folder
                    className="h-5 w-5"
                    style={{ color: f.color || 'hsl(var(--primary))' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{f.name}</div>
                  {f.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{f.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1.5">
                    {f.item_count ?? 0} timesheet{(f.item_count ?? 0) === 1 ? '' : 's'}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => setEditing(f)}>
                      <Pencil className="h-4 w-4 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(f)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      <FolderFormDialog open={creating} onOpenChange={setCreating} />
      <FolderFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} initial={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete <strong>{deleting?.name}</strong> and remove all its memberships. The underlying timesheets are not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) remove.mutate(deleting.id);
                setDeleting(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus, Folder, Loader2 } from 'lucide-react';
import { useTimesheetFolders } from '@/hooks/useTimesheetFolders';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timesheetIds: string[];
  onMoved?: () => void;
}

export const MoveToFolderDialog: React.FC<Props> = ({ open, onOpenChange, timesheetIds, onMoved }) => {
  const { list, create, moveTimesheets } = useTimesheetFolders();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const folders = list.data ?? [];

  const handleMove = async (folderId: string) => {
    await moveTimesheets.mutateAsync({ folderId, timesheetIds });
    onMoved?.();
    onOpenChange(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const created: any = await create.mutateAsync({ name: newName.trim() });
    setNewName('');
    setCreating(false);
    if (created?.id) {
      await handleMove(created.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move to folder</DialogTitle>
          <DialogDescription>
            Move {timesheetIds.length} timesheet{timesheetIds.length > 1 ? 's' : ''} into a folder for review.
          </DialogDescription>
        </DialogHeader>

        {creating ? (
          <div className="space-y-3">
            <Label className="text-sm">New folder name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Week of Apr 28 — Pending Approval"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newName.trim() || create.isPending || moveTimesheets.isPending}>
                {(create.isPending || moveTimesheets.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create & Move
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[320px] overflow-y-auto space-y-1 -mx-1 px-1">
              {folders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No folders yet. Create one to get started.
                </p>
              ) : (
                folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFolderId(f.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-md border text-left hover:bg-accent transition ${
                      selectedFolderId === f.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{f.name}</div>
                      <div className="text-xs text-muted-foreground">{f.item_count ?? 0} timesheet{(f.item_count ?? 0) === 1 ? '' : 's'}</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <Button variant="outline" onClick={() => setCreating(true)} className="w-full gap-2">
              <FolderPlus className="h-4 w-4" /> New folder
            </Button>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                onClick={() => selectedFolderId && handleMove(selectedFolderId)}
                disabled={!selectedFolderId || moveTimesheets.isPending}
              >
                {moveTimesheets.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Move here
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

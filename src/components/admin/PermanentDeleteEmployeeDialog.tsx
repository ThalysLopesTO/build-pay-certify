import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface Employee {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface PermanentDeleteEmployeeDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const PermanentDeleteEmployeeDialog: React.FC<PermanentDeleteEmployeeDialogProps> = ({
  employee,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmed = confirmText === 'DELETE';

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText('');
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setConfirmText('');
    }
  };

  if (!employee) return null;

  const employeeName = `${employee.first_name} ${employee.last_name}`;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Permanently Delete Employee
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-destructive">
                    THIS ACTION CANNOT BE UNDONE
                  </p>
                  <p className="text-muted-foreground">
                    This will permanently delete <span className="font-semibold text-foreground">{employeeName}</span> from the entire system.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-semibold text-foreground">Employee Details:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Name: {employeeName}</li>
                  <li>Email: {employee.email}</li>
                  <li>Role: {employee.role}</li>
                </ul>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-semibold text-destructive">What will be deleted:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Authentication account (cannot login)</li>
                  <li>User profile and personal data</li>
                  <li>Employee certificates</li>
                  <li>Jobsite assignments</li>
                </ul>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-semibold text-primary">What will be kept (for audit):</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Timesheet records</li>
                  <li>Daily reports (marked as submitted by "Deleted User")</li>
                  <li>Audit logs</li>
                  <li>Historical payroll data</li>
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="confirm-delete" className="text-sm font-semibold text-foreground">
                  Type <span className="text-destructive font-mono">DELETE</span> to confirm:
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="font-mono"
                  disabled={isLoading}
                />
                {!isConfirmed && confirmText.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Please type DELETE exactly as shown (all caps)
                  </p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete Forever'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

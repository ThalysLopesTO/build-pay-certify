
import React, { useEffect, useState } from 'react';
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
import { Employee, useDeleteEmployee } from '@/hooks/new/useUsers';
interface EmployeeDeleteDialogProps {
  onClose: () => void;
  employee?: Employee
}

const EmployeeDeleteDialog = ({
  onClose,
  employee,
}: EmployeeDeleteDialogProps) => {
  const [open, setOpen] = useState(false);
  
  const deleteEmployee = useDeleteEmployee()
  
  useEffect(() => {
    if (employee) setOpen(true)
    else setOpen(false)
  },[employee])

  const confirmDeleteEmployee = () => {
    if (!employee) return;

    deleteEmployee.mutate(employee.user_id, {
      onSettled: () => onClose
    });
  };

  const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : '';

  const isDeleting = false;
  
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Employee</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive "{employeeName}"? This will remove them from the active employee list 
            and revoke their access, but preserve all their historical records. You can reactivate them later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteEmployee}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Archiving...' : 'Archive Employee'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmployeeDeleteDialog;

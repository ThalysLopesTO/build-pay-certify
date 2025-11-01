import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserCheck, Users, Trash2 } from 'lucide-react';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { useEmployees, useToggleEmployeeStatus } from '@/hooks/new/useUsers';
import { usePermanentlyDeleteEmployee } from '@/hooks/usePermanentlyDeleteEmployee';
import { PermanentDeleteEmployeeDialog } from '@/components/admin/PermanentDeleteEmployeeDialog';

interface ArchivedEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ArchivedEmployeesModalContext: React.FC<ArchivedEmployeesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data, isLoading: loading } = useEmployees();
  const archivedEmployees = data?.archivedEmployees;
  const toggleStatus = useToggleEmployeeStatus();
  const permanentlyDelete = usePermanentlyDeleteEmployee();

  const filteredEmployees = archivedEmployees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.trade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReactivate = async (employeeUserId: string) => {
    toggleStatus.mutate({ id: employeeUserId, isActive: true })
  };

  const handlePermanentDeleteClick = (employee: any) => {
    setEmployeeToDelete(employee);
    setShowDeleteDialog(true);
  };

  const handleConfirmPermanentDelete = () => {
    if (employeeToDelete) {
      permanentlyDelete.mutate(employeeToDelete.user_id, {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setEmployeeToDelete(null);
        }
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Archived Employees
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search archived employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Employee List */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading archived employees...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No archived employees match your search.' : 'No archived employees found.'}
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar
                      photoUrl={employee.photo_url}
                      firstName={employee.first_name}
                      lastName={employee.last_name}
                      size="sm"
                    />
                    <div>
                      <h3 className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{employee.position || 'Worker'}</span>
                        {employee.trade && (
                          <>
                            <span>•</span>
                            <span>{employee.trade}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {employee.role}
                        </Badge>
                        {employee.hourly_rate && (
                          <Badge variant="outline" className="text-xs">
                            ${employee.hourly_rate}/hr
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReactivate(employee.user_id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={toggleStatus.isPending}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Reactivate
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePermanentDeleteClick(employee)}
                      disabled={permanentlyDelete.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Forever
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>

      <PermanentDeleteEmployeeDialog
        employee={employeeToDelete}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmPermanentDelete}
        isLoading={permanentlyDelete.isPending}
      />
    </Dialog>
  );
};

export default ArchivedEmployeesModalContext;
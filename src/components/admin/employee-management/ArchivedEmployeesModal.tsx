import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, RotateCcw, User } from 'lucide-react';
import { useArchivedEmployees } from '@/hooks/useArchivedEmployees';
import { useEmployeeReactivate } from '@/hooks/useEmployeeReactivate';

interface ArchivedEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ArchivedEmployeesModal: React.FC<ArchivedEmployeesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: archivedEmployees = [], isLoading } = useArchivedEmployees();
  const reactivateEmployeeMutation = useEmployeeReactivate();

  const filteredEmployees = archivedEmployees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.trade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReactivate = (employeeUserId: string) => {
    reactivateEmployeeMutation.mutate(employeeUserId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Archived Employees
          </DialogTitle>
          <DialogDescription>
            View and reactivate previously archived employees. Reactivating an employee will restore their access and make them visible in the active employee list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search archived employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Employee List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading archived employees...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No archived employees match your search' : 'No archived employees found'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {employee.role}
                          </Badge>
                          {employee.trade && (
                            <span className="text-sm text-gray-600">
                              {employee.trade}
                            </span>
                          )}
                          {employee.position && (
                            <span className="text-sm text-gray-600">
                              • {employee.position}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleReactivate(employee.user_id)}
                      disabled={reactivateEmployeeMutation.isPending}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {reactivateEmployeeMutation.isPending ? 'Reactivating...' : 'Reactivate'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArchivedEmployeesModal;
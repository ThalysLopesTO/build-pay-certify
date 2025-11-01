import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCompanyEmployees } from '@/hooks/useCompanyEmployees';
import { Search, UserPlus } from 'lucide-react';

interface TaskAssigneeSelectorProps {
  open: boolean;
  onClose: () => void;
  onAssign: (userId: string) => void;
  currentAssignees: string[];
}

export const TaskAssigneeSelector: React.FC<TaskAssigneeSelectorProps> = ({
  open,
  onClose,
  onAssign,
  currentAssignees,
}) => {
  const [search, setSearch] = useState('');
  const { data: employees = [] } = useCompanyEmployees();

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    return (
      fullName.includes(search.toLowerCase()) &&
      !currentAssignees.includes(emp.user_id)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Employee</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No employees found
              </p>
            ) : (
              filteredEmployees.map((employee) => {
                const fullName = `${employee.first_name} ${employee.last_name}`;
                const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
                
                return (
                  <button
                    key={employee.user_id}
                    onClick={() => onAssign(employee.user_id)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={employee.photo_url || undefined} alt={fullName} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{employee.role}</p>
                    </div>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

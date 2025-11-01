import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { useCompanyEmployees } from '@/hooks/useCompanyEmployees';
import { useTaskAssigneeMutations } from '@/hooks/daily-tasks/useTaskAssigneeMutations';
import { Search } from 'lucide-react';

interface TaskAssigneeSelectorProps {
  taskId: string;
  listId: string;
  currentAssignees: Array<{ user_id: string }>;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const TaskAssigneeSelector = ({
  taskId,
  listId,
  currentAssignees,
  children,
  open,
  onOpenChange,
}: TaskAssigneeSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: employees = [], isLoading } = useCompanyEmployees();
  const { assignEmployee, unassignEmployee } = useTaskAssigneeMutations(listId);

  const currentAssigneeIds = new Set(currentAssignees.map((a) => a.user_id));

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleToggleAssignee = (userId: string, isAssigned: boolean) => {
    if (isAssigned) {
      unassignEmployee.mutate({ itemId: taskId, userId });
    } else {
      assignEmployee.mutate({ itemId: taskId, userId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Employees</DialogTitle>
          <DialogDescription>
            Select employees to assign to this task
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading employees...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No employees found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((employee) => {
                  const isAssigned = currentAssigneeIds.has(employee.user_id);
                  return (
                    <div
                      key={employee.user_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleToggleAssignee(employee.user_id, isAssigned)}
                    >
                      <Checkbox
                        checked={isAssigned}
                        onCheckedChange={() => handleToggleAssignee(employee.user_id, isAssigned)}
                      />
                      <EmployeeAvatar
                        photoUrl={employee.photo_url}
                        firstName={employee.first_name}
                        lastName={employee.last_name}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        {employee.role && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {employee.role}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange?.(false)}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

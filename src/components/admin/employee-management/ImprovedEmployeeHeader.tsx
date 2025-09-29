import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Archive, Users } from 'lucide-react';

interface ImprovedEmployeeHeaderProps {
  canAddEmployee: boolean;
  onAddEmployee: () => void;
  onViewArchived?: () => void;
  employeeCount: number;
}

const ImprovedEmployeeHeader: React.FC<ImprovedEmployeeHeaderProps> = ({
  canAddEmployee,
  onAddEmployee,
  onViewArchived,
  employeeCount
}) => {
  return (
    <div className="bg-card rounded-xl shadow-sm border p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
              <p className="text-muted-foreground">Manage your team members, roles, and certifications</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1">
                <Users className="h-3 w-3 mr-1" />
                {employeeCount} Active Employees
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {onViewArchived && (
            <Button 
              variant="outline"
              onClick={onViewArchived}
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              View Archived
            </Button>
          )}
          {canAddEmployee && (
            <Button 
              onClick={onAddEmployee}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImprovedEmployeeHeader;
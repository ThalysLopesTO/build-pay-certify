import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Archive } from 'lucide-react';

interface EmployeeHeaderProps {
  canAddEmployee: boolean;
  onAddEmployee: () => void;
  onViewArchived?: () => void;
}

const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
  canAddEmployee,
  onAddEmployee,
  onViewArchived
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
      <div>
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <p className="text-slate-600">Manage employee roles, rates, and certifications</p>
      </div>
      <div className="flex gap-2">
        {onViewArchived && (
          <Button 
            variant="outline"
            onClick={onViewArchived}
          >
            <Archive className="h-4 w-4 mr-2" />
            View Archived
          </Button>
        )}
        {canAddEmployee && (
          <Button 
            className="bg-orange-600 hover:bg-orange-700"
            onClick={onAddEmployee}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmployeeHeader;
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface EmployeeHeaderProps {
  canAddEmployee: boolean;
  onAddEmployee: () => void;
}

const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
  canAddEmployee,
  onAddEmployee
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
      <div>
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <p className="text-slate-600">Manage employee roles, rates, and certifications</p>
      </div>
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
  );
};

export default EmployeeHeader;
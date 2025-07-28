import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, KeyRound } from 'lucide-react';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { Employee } from '@/contexts/EmployeeContext';
import { getRoleColor, getCertStatusIcon, getCertStatusText, getCertStatus } from './employeeHelpers';
import { canResetPassword } from '@/hooks/usePasswordManagement';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface EmployeeCardProps {
  employee: Employee;
  isAdmin: boolean;
  onEdit: (employee: Employee) => void;
  onViewCertificates: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onResetPassword: (employee: Employee) => void;
  isDeleting: boolean;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  isAdmin,
  onEdit,
  onViewCertificates,
  onDelete,
  onResetPassword,
  isDeleting
}) => {
  const { user } = useAuth();
  const certStatus = getCertStatus(); // Mock status - will be replaced with real data
  
  const canReset = user?.role && canResetPassword(user.role, employee.role);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <EmployeeAvatar 
            photoUrl={employee.photo_url}
            firstName={employee.first_name}
            lastName={employee.last_name}
            size="md"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-slate-600">{employee.companies?.name}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={`${getRoleColor(employee.role)} text-white capitalize`}>
                  {employee.role}
                </Badge>
                <Badge 
                  variant={employee.worker_type === 'employee' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {employee.worker_type === 'employee' ? 'Payroll Employee' : 'Subcontractor'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-600">Trade:</span>
            <span className="font-medium">{employee.trade || 'Not specified'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Position:</span>
            <span className="font-medium">{employee.position || 'Not specified'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Hourly Rate:</span>
            <span className="font-medium">${employee.hourly_rate || 0}/hr</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Certifications:</span>
            <div className="flex items-center space-x-2">
              {getCertStatusIcon(certStatus)}
              <span className="text-sm">{getCertStatusText(certStatus)}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit(employee)}
          >
            Edit Details
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewCertificates(employee)}
          >
            View Certs
          </Button>
          {canReset && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={() => onResetPassword(employee)}
              disabled={isDeleting}
              title="Reset Password"
            >
              <KeyRound className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => onDelete(employee)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeCard;
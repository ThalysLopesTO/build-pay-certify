import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  KeyRound, 
  Edit, 
  Award, 
  DollarSign, 
  Briefcase, 
  Building2,
  Phone,
  Mail,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { Employee } from '@/contexts/EmployeeContext';
import { getRoleColor, getCertStatusIcon, getCertStatusText } from './employeeHelpers';
import { useEmployeeCertificateStatus } from '@/hooks/useEmployeeCertificateStatus';
import { canResetPassword } from '@/hooks/usePasswordManagement';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface ImprovedEmployeeCardProps {
  employee: Employee;
  isAdmin: boolean;
  onEdit: (employee: Employee) => void;
  onViewCertificates: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onResetPassword: (employee: Employee) => void;
  isDeleting: boolean;
}

const ImprovedEmployeeCard: React.FC<ImprovedEmployeeCardProps> = ({
  employee,
  isAdmin,
  onEdit,
  onViewCertificates,
  onDelete,
  onResetPassword,
  isDeleting
}) => {
  const { user } = useAuth();
  const { data: certStatus = 'no-certificates' } = useEmployeeCertificateStatus(employee.user_id);
  
  // Get company name from companies table or fallback to current user's company
  const companyName = employee.companies?.name || user?.companyName || 'Unknown Company';
  
  const canReset = user?.role && canResetPassword(user.role, employee.role);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-card/50 backdrop-blur">
      <CardContent className="p-0">
        {/* Header Section */}
        <div className="relative p-6 pb-4">
          <div className="absolute top-4 right-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(employee)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewCertificates(employee)}>
                  <Award className="h-4 w-4 mr-2" />
                  View Certificates
                </DropdownMenuItem>
                {canReset && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onResetPassword(employee)}>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                  </>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(employee)}
                      className="text-destructive focus:text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Archive Employee
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-start gap-4">
            <EmployeeAvatar 
              photoUrl={employee.photo_url}
              firstName={employee.first_name}
              lastName={employee.last_name}
              size="lg"
              className="ring-2 ring-background shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground truncate">
                {employee.first_name} {employee.last_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground truncate">{companyName}</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className={`${getRoleColor(employee.role)} text-white text-xs`}>
                  {employee.role}
                </Badge>
                <Badge 
                  variant={employee.worker_type === 'employee' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {employee.worker_type === 'employee' ? 'Employee' : 'Contractor'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="px-6 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span>Trade</span>
              </div>
              <p className="text-sm font-medium truncate">{employee.trade || 'General'}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span>Position</span>
              </div>
              <p className="text-sm font-medium truncate">{employee.position || 'Worker'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span>Hourly Rate</span>
              </div>
              <p className="text-lg font-semibold text-primary">${employee.hourly_rate || 0}/hr</p>
            </div>
            {employee.phone && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>Phone</span>
                </div>
                <p className="text-sm font-medium truncate">{employee.phone}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Certifications</span>
            </div>
            <div className="flex items-center gap-2">
              {getCertStatusIcon(certStatus)}
              <span className="text-sm font-medium">{getCertStatusText(certStatus)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(employee)}
              className="h-9"
            >
              <Edit className="h-3 w-3 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewCertificates(employee)}
              className="h-9"
            >
              <Award className="h-3 w-3 mr-2" />
              Certificates
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedEmployeeCard;
import { useState } from 'react';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useEmployeeDelete } from '@/hooks/useEmployeeDelete';
import { useEmployeeLimit } from '@/hooks/useEmployeeLimit';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface Employee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  trade?: string;
  position?: string;
  hourly_rate?: number;
  photo_url?: string;
  companies?: {
    name: string;
  };
}

export const useEmployeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingCertificates, setViewingCertificates] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const { user } = useAuth();
  const { data: employees = [], isLoading, error, refetch } = useEmployeeDirectory();
  const { data: employeeLimit, isLoading: isLoadingLimit } = useEmployeeLimit();
  const deleteEmployeeMutation = useEmployeeDelete();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management';

  const filteredEmployees = employees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.trade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canAddEmployee = employeeLimit && employeeLimit.currentCount < employeeLimit.employeeLimit;

  const handleDeleteEmployee = (employee: Employee) => {
    setDeletingEmployee(employee);
  };

  const confirmDeleteEmployee = () => {
    if (deletingEmployee?.user_id) {
      deleteEmployeeMutation.mutate(deletingEmployee.user_id, {
        onSuccess: () => {
          setDeletingEmployee(null);
          refetch();
        }
      });
    }
  };

  return {
    // State
    searchTerm,
    editingEmployee,
    viewingCertificates,
    deletingEmployee,
    
    // Data
    employees: filteredEmployees,
    isLoading,
    error,
    isAdmin,
    canAddEmployee,
    
    // Actions
    setSearchTerm,
    setEditingEmployee,
    setViewingCertificates,
    setDeletingEmployee,
    handleDeleteEmployee,
    confirmDeleteEmployee,
    refetch,
    
    // Loading states
    isDeleting: deleteEmployeeMutation.isPending
  };
};
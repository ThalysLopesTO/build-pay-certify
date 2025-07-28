import { useState } from 'react';
import { useEmployees, Employee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useEmployeeLimit } from '@/hooks/useEmployeeLimit';

export const useEmployeeManagementContext = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingCertificates, setViewingCertificates] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const { user } = useAuth();
  const { data: employeeLimit, isLoading: isLoadingLimit } = useEmployeeLimit();
  const {
    employees,
    archivedEmployees,
    loading,
    error,
    activeEmployeeCount,
    archiveEmployee,
    reactivateEmployee,
  } = useEmployees();

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

  const confirmDeleteEmployee = async () => {
    if (deletingEmployee?.user_id) {
      try {
        await archiveEmployee(deletingEmployee.user_id);
        setDeletingEmployee(null);
      } catch (error) {
        console.error('Error archiving employee:', error);
      }
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
    archivedEmployees,
    loading,
    error,
    isAdmin,
    canAddEmployee,
    activeEmployeeCount,
    
    // Actions
    setSearchTerm,
    setEditingEmployee,
    setViewingCertificates,
    setDeletingEmployee,
    handleDeleteEmployee,
    confirmDeleteEmployee,
    archiveEmployee,
    reactivateEmployee,
  };
};
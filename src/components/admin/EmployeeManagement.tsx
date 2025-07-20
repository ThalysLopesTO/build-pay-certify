import React, { useState } from 'react';
import EmployeeEditModal from './EmployeeEditModal';
import EmployeeCertificatesModal from './EmployeeCertificatesModal';
import EmployeeDeleteDialog from './EmployeeDeleteDialog';
import PasswordResetModal from './PasswordResetModal';
import ArchivedEmployeesModal from './employee-management/ArchivedEmployeesModal';
import EmployeeHeader from './employee-management/EmployeeHeader';
import EmployeeSearch from './employee-management/EmployeeSearch';
import EmployeeCard from './employee-management/EmployeeCard';
import EmployeeEmptyState from './employee-management/EmployeeEmptyState';
import EmployeeLoadingState from './employee-management/EmployeeLoadingState';
import EmployeeErrorState from './employee-management/EmployeeErrorState';
import { useEmployeeManagement, type Employee } from './employee-management/useEmployeeManagement';

const EmployeeManagement = ({ onNavigateToRegistration }: { onNavigateToRegistration?: () => void }) => {
  const [resettingPasswordEmployee, setResettingPasswordEmployee] = useState<Employee | null>(null);
  const [showArchivedEmployees, setShowArchivedEmployees] = useState(false);
  
  const {
    searchTerm,
    editingEmployee,
    viewingCertificates,
    deletingEmployee,
    employees,
    isLoading,
    error,
    isAdmin,
    canAddEmployee,
    setSearchTerm,
    setEditingEmployee,
    setViewingCertificates,
    setDeletingEmployee,
    handleDeleteEmployee,
    confirmDeleteEmployee,
    refetch,
    isDeleting
  } = useEmployeeManagement();

  const handleAddEmployee = () => {
    if (onNavigateToRegistration) {
      onNavigateToRegistration();
    }
  };

  const handleResetPassword = (employee: Employee) => {
    setResettingPasswordEmployee(employee);
  };

  if (isLoading) {
    return <EmployeeLoadingState />;
  }

  if (error) {
    return <EmployeeErrorState />;
  }

  return (
    <div className="space-y-6">
      <EmployeeHeader 
        canAddEmployee={!!canAddEmployee}
        onAddEmployee={handleAddEmployee}
        onViewArchived={() => setShowArchivedEmployees(true)}
      />

      <EmployeeSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {employees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            isAdmin={isAdmin}
            onEdit={setEditingEmployee}
            onViewCertificates={setViewingCertificates}
            onDelete={handleDeleteEmployee}
            onResetPassword={handleResetPassword}
            isDeleting={isDeleting}
          />
        ))}
      </div>

      {employees.length === 0 && <EmployeeEmptyState />}

      <EmployeeEditModal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        employee={editingEmployee as any}
        onSuccess={() => {
          refetch();
          setEditingEmployee(null);
        }}
      />

      <EmployeeCertificatesModal
        isOpen={!!viewingCertificates}
        onClose={() => setViewingCertificates(null)}
        employee={viewingCertificates}
      />

      <PasswordResetModal
        isOpen={!!resettingPasswordEmployee}
        onClose={() => setResettingPasswordEmployee(null)}
        employee={resettingPasswordEmployee}
      />

      <EmployeeDeleteDialog
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={confirmDeleteEmployee}
        employeeName={deletingEmployee ? `${deletingEmployee.first_name} ${deletingEmployee.last_name}` : ''}
        isDeleting={isDeleting}
      />

      <ArchivedEmployeesModal
        isOpen={showArchivedEmployees}
        onClose={() => setShowArchivedEmployees(false)}
      />
    </div>
  );
};

export default EmployeeManagement;

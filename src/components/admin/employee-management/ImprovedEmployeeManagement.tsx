import React, { useState } from 'react';
import EmployeeEditModal from '../EmployeeEditModal';
import EmployeeCertificatesModal from '../EmployeeCertificatesModal';
import EmployeeDeleteDialog from '../EmployeeDeleteDialog';
import PasswordResetModal from '../PasswordResetModal';
import ArchivedEmployeesModalContext from './ArchivedEmployeesModalContext';
import ImprovedEmployeeHeader from './ImprovedEmployeeHeader';
import ImprovedEmployeeSearch from './ImprovedEmployeeSearch';
import ImprovedEmployeeCard from './ImprovedEmployeeCard';
import EmployeeEmptyState from './EmployeeEmptyState';
import EmployeeLoadingState from './EmployeeLoadingState';
import EmployeeErrorState from './EmployeeErrorState';
import { Employee, IsCanAddEmployee, useDeleteEmployee, useEmployees, useIsAdmin } from '@/hooks/new/useUsers';

const ImprovedEmployeeManagement = ({ onNavigateToRegistration }: { onNavigateToRegistration?: () => void }) => {
  const [resettingPasswordEmployee, setResettingPasswordEmployee] = useState<Employee | null>(null);
  const [showArchivedEmployees, setShowArchivedEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState("")
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingCertificates, setViewingCertificates] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const { data, isLoading: loading, isError: error } = useEmployees();
  const canAddEmployee = IsCanAddEmployee();
  const activeEmployeeCount = data.activeEmployeeCount;
  const employees = (data?.activeEmployees ?? []).filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.trade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = useIsAdmin();

  const handleAddEmployee = () => {
    if (onNavigateToRegistration) {
      onNavigateToRegistration();
    }
  };

  const handleDeleteEmployee = (e: Employee) => setDeletingEmployee(e)

  const deleteEmployee = useDeleteEmployee()

  const confirmDeleteEmployee = () => {
    if (!deletingEmployee) return;

    deleteEmployee.mutate(deletingEmployee.user_id, {
      onSettled: () => setDeletingEmployee(null)
    });
  };

  const handleResetPassword = (employee: Employee) => setResettingPasswordEmployee(employee);

  if (loading) return <EmployeeLoadingState />;

  if (error) return <EmployeeErrorState />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <ImprovedEmployeeHeader
          canAddEmployee={!!canAddEmployee}
          onAddEmployee={handleAddEmployee}
          onViewArchived={() => setShowArchivedEmployees(true)}
          employeeCount={activeEmployeeCount}
        />

        <ImprovedEmployeeSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {employees.length === 0 ? <EmployeeEmptyState /> 
        : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <ImprovedEmployeeCard
                key={employee.id}
                employee={employee}
                isAdmin={isAdmin}
                onEdit={setEditingEmployee}
                onViewCertificates={setViewingCertificates}
                onDelete={handleDeleteEmployee}
                onResetPassword={handleResetPassword}
                isDeleting={false}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <EmployeeEditModal
          isOpen={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          employee={editingEmployee as any}
          onSuccess={() => {
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
          isDeleting={false}
        />

        <ArchivedEmployeesModalContext
          isOpen={showArchivedEmployees}
          onClose={() => setShowArchivedEmployees(false)}
        />
      </div>
    </div>
  );
};

export default ImprovedEmployeeManagement;
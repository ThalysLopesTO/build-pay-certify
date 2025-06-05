
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import EmployeeEditModal from './EmployeeEditModal';
import EmployeeCertificatesModal from './EmployeeCertificatesModal';

const EmployeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [viewingCertificates, setViewingCertificates] = useState<any>(null);
  
  const { data: employees = [], isLoading, error, refetch } = useEmployeeDirectory();

  const filteredEmployees = employees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.trade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'foreman':
        return 'bg-blue-500';
      case 'payroll':
        return 'bg-green-500';
      default:
        return 'bg-slate-500';
    }
  };

  // Mock function to determine certificate status
  const getCertStatus = () => {
    const statuses = ['all-valid', 'expiring', 'expired'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getCertStatusIcon = (status: string) => {
    switch (status) {
      case 'all-valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expiring':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-slate-500" />;
    }
  };

  const getCertStatusText = (status: string) => {
    switch (status) {
      case 'all-valid':
        return 'All Valid';
      case 'expiring':
        return 'Expiring Soon';
      case 'expired':
        return 'Has Expired';
      default:
        return 'Unknown';
    }
  };

  const handleAddEmployee = () => {
    // This will be handled by the parent component (AdminDashboard)
    // by setting the activeTab to 'employee-registration'
    window.dispatchEvent(new CustomEvent('navigateToEmployeeRegistration'));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">Error loading employees</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Employee Management</h2>
          <p className="text-slate-600">Manage employee roles, rates, and certifications</p>
        </div>
        <Button 
          className="bg-orange-600 hover:bg-orange-700"
          onClick={handleAddEmployee}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search employees by name, trade, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Employee List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEmployees.map((employee) => {
          const certStatus = getCertStatus(); // Mock status
          return (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <p className="text-slate-600">{employee.companies?.name}</p>
                  </div>
                  <Badge className={`${getRoleColor(employee.role)} text-white capitalize`}>
                    {employee.role}
                  </Badge>
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
                    onClick={() => setEditingEmployee(employee)}
                  >
                    Edit Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setViewingCertificates(employee)}
                  >
                    View Certs
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No employees found matching your search</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Employee Modal */}
      <EmployeeEditModal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        employee={editingEmployee}
        onSuccess={() => {
          refetch();
          setEditingEmployee(null);
        }}
      />

      {/* View Certificates Modal */}
      <EmployeeCertificatesModal
        isOpen={!!viewingCertificates}
        onClose={() => setViewingCertificates(null)}
        employee={viewingCertificates}
      />
    </div>
  );
};

export default EmployeeManagement;


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  trade: string;
  position: string;
  hourlyRate: number;
  certStatus: 'all-valid' | 'expiring' | 'expired';
  lastActive: string;
}

const EmployeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock employee data
  const employees: Employee[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'admin@construction.com',
      role: 'admin',
      trade: 'General',
      position: 'Site Manager',
      hourlyRate: 35,
      certStatus: 'expiring',
      lastActive: '2024-06-02'
    },
    {
      id: '2',
      name: 'Mike Johnson',
      email: 'mike@construction.com',
      role: 'employee',
      trade: 'Electrical',
      position: 'Electrician',
      hourlyRate: 28,
      certStatus: 'expired',
      lastActive: '2024-06-01'
    },
    {
      id: '3',
      name: 'Sarah Williams',
      email: 'sarah@construction.com',
      role: 'foreman',
      trade: 'Carpentry',
      position: 'Lead Carpenter',
      hourlyRate: 32,
      certStatus: 'all-valid',
      lastActive: '2024-06-02'
    },
    {
      id: '4',
      name: 'Robert Chen',
      email: 'robert@construction.com',
      role: 'employee',
      trade: 'Plumbing',
      position: 'Plumber',
      hourlyRate: 30,
      certStatus: 'all-valid',
      lastActive: '2024-06-01'
    }
  ];

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Employee Management</h2>
          <p className="text-slate-600">Manage employee roles, rates, and certifications</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
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
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{employee.name}</h3>
                  <p className="text-slate-600">{employee.email}</p>
                </div>
                <Badge className={`${getRoleColor(employee.role)} text-white capitalize`}>
                  {employee.role}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Trade:</span>
                  <span className="font-medium">{employee.trade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Position:</span>
                  <span className="font-medium">{employee.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Hourly Rate:</span>
                  <span className="font-medium">${employee.hourlyRate}/hr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Certifications:</span>
                  <div className="flex items-center space-x-2">
                    {getCertStatusIcon(employee.certStatus)}
                    <span className="text-sm">{getCertStatusText(employee.certStatus)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Last Active:</span>
                  <span className="text-sm">{new Date(employee.lastActive).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex space-x-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  Edit Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  View Certs
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No employees found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeManagement;

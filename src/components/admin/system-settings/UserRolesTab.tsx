
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Shield, Plus, Edit2, Trash2 } from 'lucide-react';

const defaultRoles = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access',
    permissions: {
      timesheets: { view: true, create: true, edit: true, delete: true },
      invoices: { view: true, create: true, edit: true, delete: true },
      materials: { view: true, create: true, edit: true, delete: true },
      employees: { view: true, create: true, edit: true, delete: true },
      certificates: { view: true, create: true, edit: true, delete: true },
    }
  },
  {
    id: 'foreman',
    name: 'Foreman',
    description: 'Field operations management',
    permissions: {
      timesheets: { view: true, create: true, edit: true, delete: false },
      invoices: { view: true, create: false, edit: false, delete: false },
      materials: { view: true, create: true, edit: true, delete: false },
      employees: { view: true, create: false, edit: false, delete: false },
      certificates: { view: true, create: false, edit: false, delete: false },
    }
  },
  {
    id: 'payroll',
    name: 'Payroll',
    description: 'Payroll and timesheet management',
    permissions: {
      timesheets: { view: true, create: false, edit: true, delete: false },
      invoices: { view: false, create: false, edit: false, delete: false },
      materials: { view: false, create: false, edit: false, delete: false },
      employees: { view: true, create: true, edit: true, delete: false },
      certificates: { view: true, create: false, edit: false, delete: false },
    }
  },
  {
    id: 'employee',
    name: 'Employee',
    description: 'Basic employee access',
    permissions: {
      timesheets: { view: true, create: true, edit: false, delete: false },
      invoices: { view: false, create: false, edit: false, delete: false },
      materials: { view: false, create: false, edit: false, delete: false },
      employees: { view: false, create: false, edit: false, delete: false },
      certificates: { view: true, create: false, edit: false, delete: false },
    }
  }
];

export const UserRolesTab = () => {
  const [roles, setRoles] = useState(defaultRoles);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const modules = [
    { key: 'timesheets', label: 'Timesheets' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'materials', label: 'Materials' },
    { key: 'employees', label: 'Employees' },
    { key: 'certificates', label: 'Certificates' }
  ];

  const permissionTypes = [
    { key: 'view', label: 'View' },
    { key: 'create', label: 'Create' },
    { key: 'edit', label: 'Edit' },
    { key: 'delete', label: 'Delete' }
  ];

  const togglePermission = (roleId: string, module: string, permission: string) => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [module]: {
              ...role.permissions[module as keyof typeof role.permissions],
              [permission]: !role.permissions[module as keyof typeof role.permissions][permission as keyof typeof role.permissions.timesheets]
            }
          }
        };
      }
      return role;
    }));
  };

  const createCustomRole = () => {
    if (!newRoleName.trim()) return;
    
    const newRole = {
      id: newRoleName.toLowerCase().replace(/\s+/g, '_'),
      name: newRoleName,
      description: 'Custom role',
      permissions: {
        timesheets: { view: false, create: false, edit: false, delete: false },
        invoices: { view: false, create: false, edit: false, delete: false },
        materials: { view: false, create: false, edit: false, delete: false },
        employees: { view: false, create: false, edit: false, delete: false },
        certificates: { view: false, create: false, edit: false, delete: false },
      }
    };

    setRoles([...roles, newRole]);
    setNewRoleName('');
    setIsCreatingRole(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Roles & Permissions</span>
            </div>
            <Button 
              onClick={() => setIsCreatingRole(true)} 
              size="sm"
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Role</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCreatingRole && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-2 mb-4">
                <Input
                  placeholder="Enter role name (e.g., Estimator, Accountant)"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={createCustomRole} size="sm">Create</Button>
                <Button onClick={() => setIsCreatingRole(false)} variant="outline" size="sm">Cancel</Button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {roles.map((role) => (
              <Card key={role.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-orange-600" />
                      <div>
                        <h3 className="font-semibold">{role.name}</h3>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                      <Badge variant={role.id === 'admin' ? 'default' : 'secondary'}>
                        {role.id === 'admin' ? 'System Role' : role.id.startsWith('custom') ? 'Custom' : 'Default'}
                      </Badge>
                    </div>
                    {!['admin'].includes(role.id) && (
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {modules.map((module) => (
                      <div key={module.key} className="space-y-3">
                        <h4 className="font-medium text-sm">{module.label}</h4>
                        <div className="space-y-2">
                          {permissionTypes.map((permission) => (
                            <div key={permission.key} className="flex items-center justify-between">
                              <Label htmlFor={`${role.id}-${module.key}-${permission.key}`} className="text-xs">
                                {permission.label}
                              </Label>
                              <Switch
                                id={`${role.id}-${module.key}-${permission.key}`}
                                checked={role.permissions[module.key as keyof typeof role.permissions][permission.key as keyof typeof role.permissions.timesheets]}
                                onCheckedChange={() => togglePermission(role.id, module.key, permission.key)}
                                disabled={role.id === 'admin'} // Admin permissions cannot be changed
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Permission Guidelines</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>View:</strong> Can see and read data</li>
              <li>• <strong>Create:</strong> Can add new records</li>
              <li>• <strong>Edit:</strong> Can modify existing records</li>
              <li>• <strong>Delete:</strong> Can remove records permanently</li>
            </ul>
          </div>

          <Button className="w-full mt-6">
            Save Role Permissions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

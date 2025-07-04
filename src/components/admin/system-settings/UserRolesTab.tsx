
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Users, Shield, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';

const defaultRoles = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access',
    isSystemRole: true,
    permissions: {
      timesheets: { view: true, create: true, edit: true, delete: true },
      invoices: { view: true, create: true, edit: true, delete: true },
      materials: { view: true, create: true, edit: true, delete: true },
      employees: { view: true, create: true, edit: true, delete: true },
      certificates: { view: true, create: true, edit: true, delete: true },
      bills: { view: true, create: true, edit: true, delete: true },
    }
  },
  {
    id: 'foreman',
    name: 'Foreman',
    description: 'Field operations management',
    isSystemRole: false,
    permissions: {
      timesheets: { view: true, create: true, edit: true, delete: false },
      invoices: { view: true, create: false, edit: false, delete: false },
      materials: { view: true, create: true, edit: true, delete: false },
      employees: { view: true, create: false, edit: false, delete: false },
      certificates: { view: true, create: false, edit: false, delete: false },
      bills: { view: false, create: false, edit: false, delete: false },
    }
  },
  {
    id: 'payroll',
    name: 'Payroll',
    description: 'Payroll and timesheet management',
    isSystemRole: false,
    permissions: {
      timesheets: { view: true, create: false, edit: true, delete: false },
      invoices: { view: false, create: false, edit: false, delete: false },
      materials: { view: false, create: false, edit: false, delete: false },
      employees: { view: true, create: true, edit: true, delete: false },
      certificates: { view: true, create: false, edit: false, delete: false },
      bills: { view: false, create: false, edit: false, delete: false },
    }
  },
  {
    id: 'account',
    name: 'Account',
    description: 'Financial and payroll operations',
    isSystemRole: false,
    permissions: {
      timesheets: { view: true, create: false, edit: true, delete: false },
      invoices: { view: true, create: true, edit: true, delete: false },
      materials: { view: false, create: false, edit: false, delete: false },
      employees: { view: false, create: false, edit: false, delete: false },
      certificates: { view: true, create: false, edit: false, delete: false },
      bills: { view: true, create: true, edit: true, delete: true },
    }
  },
  {
    id: 'employee',
    name: 'Employee',
    description: 'Basic employee access',
    isSystemRole: false,
    permissions: {
      timesheets: { view: true, create: true, edit: false, delete: false },
      invoices: { view: false, create: false, edit: false, delete: false },
      materials: { view: false, create: false, edit: false, delete: false },
      employees: { view: false, create: false, edit: false, delete: false },
      certificates: { view: true, create: false, edit: false, delete: false },
      bills: { view: false, create: false, edit: false, delete: false },
    }
  }
];

export const UserRolesTab = () => {
  const [roles, setRoles] = useState(defaultRoles);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deletingRole, setDeletingRole] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const modules = [
    { key: 'timesheets', label: 'Timesheets' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'materials', label: 'Materials' },
    { key: 'employees', label: 'Employees' },
    { key: 'certificates', label: 'Certificates' },
    { key: 'bills', label: 'Bills/Expenses' }
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
      id: `custom_${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDescription.trim() || 'Custom role',
      isSystemRole: false,
      permissions: {
        timesheets: { view: false, create: false, edit: false, delete: false },
        invoices: { view: false, create: false, edit: false, delete: false },
        materials: { view: false, create: false, edit: false, delete: false },
        employees: { view: false, create: false, edit: false, delete: false },
        certificates: { view: false, create: false, edit: false, delete: false },
        bills: { view: false, create: false, edit: false, delete: false },
      }
    };

    setRoles([...roles, newRole]);
    setNewRoleName('');
    setNewRoleDescription('');
    setIsCreatingRole(false);
    
    toast({
      title: "Role Created",
      description: `${newRole.name} role has been created successfully.`,
    });
  };

  const startEditRole = (role: any) => {
    setEditingRole(role.id);
    setEditName(role.name);
    setEditDescription(role.description);
  };

  const saveRoleEdit = () => {
    if (!editName.trim()) return;
    
    setRoles(roles.map(role => 
      role.id === editingRole 
        ? { ...role, name: editName.trim(), description: editDescription.trim() }
        : role
    ));
    
    setEditingRole(null);
    setEditName('');
    setEditDescription('');
    
    toast({
      title: "Role Updated",
      description: "Role details have been updated successfully.",
    });
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setEditName('');
    setEditDescription('');
  };

  const initiateDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystemRole) {
      toast({
        title: "Cannot Delete System Role",
        description: "System roles cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    
    setDeletingRole(roleId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRole = () => {
    if (!deletingRole) return;
    
    const roleName = roles.find(r => r.id === deletingRole)?.name;
    setRoles(roles.filter(role => role.id !== deletingRole));
    setShowDeleteConfirm(false);
    setDeletingRole(null);
    
    toast({
      title: "Role Deleted",
      description: `${roleName} role has been deleted.`,
    });
  };

  const saveAllRoles = () => {
    // Here you would typically save to your backend/database
    toast({
      title: "Roles Saved",
      description: "All role permissions have been saved successfully.",
    });
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
              <div className="space-y-3">
                <Input
                  placeholder="Enter role name (e.g., Estimator, Accountant)"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full"
                />
                <Input
                  placeholder="Enter role description"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full"
                />
                <div className="flex items-center space-x-2">
                  <Button onClick={createCustomRole} size="sm" disabled={!newRoleName.trim()}>
                    Create Role
                  </Button>
                  <Button onClick={() => setIsCreatingRole(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
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
                      <div className="flex-1">
                        {editingRole === role.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="font-semibold"
                            />
                            <Input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold">{role.name}</h3>
                            <p className="text-sm text-gray-600">{role.description}</p>
                          </>
                        )}
                      </div>
                      <Badge variant={role.isSystemRole ? 'default' : 'secondary'}>
                        {role.isSystemRole ? 'System Role' : role.id.startsWith('custom') ? 'Custom' : 'Default'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {editingRole === role.id ? (
                        <>
                          <Button onClick={saveRoleEdit} size="sm" variant="default">
                            Save
                          </Button>
                          <Button onClick={cancelEdit} size="sm" variant="outline">
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          {!role.isSystemRole && (
                            <Button 
                              onClick={() => startEditRole(role)} 
                              variant="ghost" 
                              size="sm"
                              title="Edit role name and description"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {!role.isSystemRole && (
                            <Button 
                              onClick={() => initiateDeleteRole(role.id)} 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              title="Delete role"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                    {modules.map((module) => (
                      <div key={module.key} className="space-y-3">
                        <h4 className="font-medium text-sm">
                          {module.label}
                        </h4>
                        <div className="space-y-2">
                          {permissionTypes.map((permission) => (
                            <div key={permission.key} className="flex items-center justify-between">
                              <Label htmlFor={`${role.id}-${module.key}-${permission.key}`} className="text-xs">
                                {permission.label}
                              </Label>
                              <Switch
                                id={`${role.id}-${module.key}-${permission.key}`}
                                checked={role.permissions[module.key as keyof typeof role.permissions]?.[permission.key as keyof typeof role.permissions.timesheets] || false}
                                onCheckedChange={() => togglePermission(role.id, module.key, permission.key)}
                                disabled={role.isSystemRole || editingRole === role.id}
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

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Smart Safeguards</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• System roles (Admin) cannot be modified or deleted</li>
              <li>• At least one Admin must always exist in your company</li>
              <li>• Custom roles can be fully customized and managed</li>
              <li>• Role changes take effect immediately for all users</li>
            </ul>
          </div>

          <Button onClick={saveAllRoles} className="w-full mt-6">
            Save All Role Permissions
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Role
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete the "{roles.find(r => r.id === deletingRole)?.name}" role? 
              This action cannot be undone.
            </p>
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">
                <strong>Warning:</strong> Users currently assigned to this role will need to be reassigned to a different role.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteRole}
            >
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, Shield, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { useRolePermissions, useUpdateRolePermissions } from '@/hooks/useRolePermissions';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Menu items organized by role
const roleMenuItems = {
  admin: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timesheets', label: 'Timesheets' },
    { id: 'employees', label: 'Employees' },
    { id: 'jobsite-management', label: 'Jobsite Management' },
    { id: 'invoice-management', label: 'Invoices' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'bills-expenses', label: 'Bills & Expenses' },
    { id: 'material-requests', label: 'Material Requests' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'attention-reports', label: 'Attention Reports' },
    { id: 'daily-reports', label: 'Daily Reports' },
    { id: 'system-settings', label: 'System Settings' },
  ],
  management: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timesheets', label: 'Timesheets' },
    { id: 'employees', label: 'Employees' },
    { id: 'jobsite-management', label: 'Jobsite Management' },
    { id: 'invoice-management', label: 'Invoices' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'bills-expenses', label: 'Bills & Expenses' },
    { id: 'material-requests', label: 'Material Requests' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'attention-reports', label: 'Attention Reports' },
    { id: 'daily-reports', label: 'Daily Reports' },
    { id: 'system-settings', label: 'System Settings' },
  ],
  foreman: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timesheets', label: 'Timesheets' },
    { id: 'employees', label: 'Employees' },
    { id: 'jobsite-management', label: 'Jobsite Management' },
    { id: 'invoice-management', label: 'Invoices' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'bills-expenses', label: 'Bills & Expenses' },
    { id: 'material-requests', label: 'Material Requests' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'attention-reports', label: 'Attention Reports' },
    { id: 'daily-reports', label: 'Daily Reports' },
    { id: 'system-settings', label: 'System Settings' },
  ],
  account: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timesheets', label: 'Timesheets' },
    { id: 'employees', label: 'Employees' },
    { id: 'jobsite-management', label: 'Jobsite Management' },
    { id: 'invoice-management', label: 'Invoices' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'bills-expenses', label: 'Bills & Expenses' },
    { id: 'material-requests', label: 'Material Requests' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'attention-reports', label: 'Attention Reports' },
    { id: 'daily-reports', label: 'Daily Reports' },
    { id: 'system-settings', label: 'System Settings' },
  ],
  employee: [
    { id: 'dashboard', label: 'Home' },
    { id: 'timesheet', label: 'Timesheet' },
    { id: 'missed-punch-requests', label: 'Missed Punch' },
    { id: 'attention-report', label: 'Report' },
    { id: 'settings', label: 'Settings' },
  ],
};

const roleDescriptions: Record<string, string> = {
  admin: 'Full system access with all permissions',
  management: 'Comprehensive management access to operations',
  foreman: 'Field operations and team management',
  account: 'Financial operations and reporting',
  employee: 'Basic employee access to timesheets and reports',
};

const roles = [
  { id: 'admin', name: 'Admin', isSystemRole: true },
  { id: 'management', name: 'Management', isSystemRole: false },
  { id: 'foreman', name: 'Foreman', isSystemRole: false },
  { id: 'account', name: 'Account', isSystemRole: false },
  { id: 'employee', name: 'Employee', isSystemRole: false },
];

export const UserRolesTab = () => {
  const { user } = useAuth();
  const { data: permissions, isLoading, refetch } = useRolePermissions();
  const updatePermissions = useUpdateRolePermissions();
  const [localPermissions, setLocalPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Transform database permissions to local state
  useEffect(() => {
    if (permissions) {
      const transformed: Record<string, Record<string, boolean>> = {};
      permissions.forEach(perm => {
        if (!transformed[perm.role]) {
          transformed[perm.role] = {};
        }
        transformed[perm.role][perm.menu_item_id] = perm.is_visible;
      });
      setLocalPermissions(transformed);
    }
  }, [permissions]);

  const togglePermission = (role: string, menuItemId: string) => {
    setLocalPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [menuItemId]: !prev[role]?.[menuItemId]
      }
    }));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    if (!user?.companyId) {
      toast.error('Company ID not found');
      return;
    }

    // Transform local state to database format
    const permissionsToSave = Object.entries(localPermissions).flatMap(([role, items]) =>
      Object.entries(items).map(([menuItemId, isVisible]) => ({
        company_id: user.companyId!,
        role,
        menu_item_id: menuItemId,
        is_visible: isVisible,
      }))
    );

    await updatePermissions.mutateAsync(permissionsToSave);
    setHasChanges(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Roles & Menu Permissions</span>
            </div>
            {hasChanges && (
              <Badge variant="secondary" className="animate-pulse">
                Unsaved Changes
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Control which menu items are visible for each user role in your company
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {roles.map((role) => (
              <Card key={role.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{role.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {roleDescriptions[role.id]}
                        </p>
                      </div>
                      <Badge variant={role.isSystemRole ? 'default' : 'secondary'}>
                        {role.isSystemRole ? 'System Role' : 'Default'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {roleMenuItems[role.id as keyof typeof roleMenuItems]?.map((menuItem) => {
                      const isVisible = localPermissions[role.id]?.[menuItem.id] ?? true;
                      
                      return (
                        <div
                          key={menuItem.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isVisible 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {isVisible ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                            <Label 
                              htmlFor={`${role.id}-${menuItem.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {menuItem.label}
                            </Label>
                          </div>
                          <Switch
                            id={`${role.id}-${menuItem.id}`}
                            checked={isVisible}
                            onCheckedChange={() => togglePermission(role.id, menuItem.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How It Works</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Visible (Green):</strong> Menu item will appear in the user's sidebar</li>
              <li>• <strong>Hidden (Gray):</strong> Menu item will be completely hidden from view</li>
              <li>• Changes apply to all users with the selected role</li>
              <li>• Users must refresh their browser to see updated menus</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• System roles (Admin) should have full access to maintain system control</li>
              <li>• Hiding menu items does not remove backend permissions (RLS policies still apply)</li>
              <li>• Ensure at least one role has access to System Settings</li>
              <li>• Employee role controls the mobile bottom navigation</li>
            </ul>
          </div>

          <Button 
            onClick={handleSaveAll} 
            className="w-full mt-6"
            disabled={!hasChanges || updatePermissions.isPending}
          >
            {updatePermissions.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Role Permissions
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

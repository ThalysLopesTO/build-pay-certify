import { RolePermission } from '@/hooks/useRolePermissions';

interface MenuItem {
  id: string;
  title: string;
  icon?: any;
  [key: string]: any;
}

/**
 * Filter menu items based on role permissions
 * @param menuItems - Array of menu items to filter
 * @param rolePermissions - Array of role permissions from database
 * @param userRole - Current user's role
 * @returns Filtered menu items that are visible for the role
 */
export const filterMenuByPermissions = (
  menuItems: MenuItem[],
  rolePermissions: RolePermission[] | undefined,
  userRole: string
): MenuItem[] => {
  // If no permissions data, show all items (default behavior)
  if (!rolePermissions || rolePermissions.length === 0) {
    return menuItems;
  }

  return menuItems.filter(item => {
    const permission = rolePermissions.find(
      p => p.role === userRole && p.menu_item_id === item.id
    );
    
    // Default to visible if no permission record exists
    return permission ? permission.is_visible : true;
  });
};

/**
 * Check if a specific menu item is visible for a role
 * @param menuItemId - ID of the menu item
 * @param rolePermissions - Array of role permissions from database
 * @param userRole - Current user's role
 * @returns true if visible, false otherwise
 */
export const isMenuItemVisible = (
  menuItemId: string,
  rolePermissions: RolePermission[] | undefined,
  userRole: string
): boolean => {
  if (!rolePermissions || rolePermissions.length === 0) {
    return true;
  }

  const permission = rolePermissions.find(
    p => p.role === userRole && p.menu_item_id === menuItemId
  );
  
  return permission ? permission.is_visible : true;
};

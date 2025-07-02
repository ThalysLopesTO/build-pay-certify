
import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  Gauge,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Package,
  Settings,
  User,
  User2,
  Users,
} from 'lucide-react';
import { MenuItem } from './types';

export const menuData: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    id: 'company',
    title: 'Company',
    icon: Building2,
    items: [
      {
        id: 'company-profile',
        title: 'Company Profile',
        href: '/admin/company-profile',
        icon: Building2,
      },
      {
        id: 'subscription',
        title: 'Subscription',
        href: '/admin/subscription',
        icon: CreditCard,
      },
      {
        id: 'invoices',
        title: 'Invoices',
        href: '/admin/invoices',
        icon: CreditCard,
      },
    ],
  },
  {
    id: 'user-management',
    title: 'User Management',
    icon: Users,
    items: [
      {
        id: 'all-users',
        title: 'All Users',
        href: '/admin/users',
        icon: Users,
      },
      {
        id: 'add-user',
        title: 'Add User',
        href: '/admin/add-user',
        icon: User2,
      },
      {
        id: 'user-roles',
        title: 'User Roles',
        href: '/admin/user-roles',
        icon: User,
      },
    ],
  },
  {
    id: 'project-management',
    title: 'Project Management',
    icon: Building2,
    items: [
      {
        id: 'jobsite-management',
        title: 'Jobsite Management',
        href: '/admin/jobsite-management',
        icon: MapPin,
      },
      {
        id: 'material-takeoff',
        title: 'Material Takeoff',
        href: '/admin/material-takeoff',
        icon: Package,
      },
      {
        id: 'material-requests',
        title: 'Material Requests',
        href: '/admin/material-requests',
        icon: Inbox,
      },
      {
        id: 'timesheets',
        title: 'Timesheets',
        href: '/admin/timesheets',
        icon: Calendar,
      },
      {
        id: 'progress-tracking',
        title: 'Progress Tracking',
        href: '/admin/progress-tracking',
        icon: BarChart3,
      },
      {
        id: 'task-management',
        title: 'Task Management',
        href: '/admin/task-management',
        icon: ListChecks,
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

// Group menu items by category for the sidebar
export const groupedMenuItems = {
  main: [menuData[0]], // Dashboard
  management: [menuData[3]], // Project Management
  payroll: [],
  employees: [menuData[2]], // User Management
  invoices: [menuData[1]], // Company
  system: [menuData[4]], // Settings
};

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

export const menuData = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Company',
    icon: Building2,
    items: [
      {
        title: 'Company Profile',
        href: '/admin/company-profile',
        icon: Building2,
      },
      {
        title: 'Subscription',
        href: '/admin/subscription',
        icon: CreditCard,
      },
      {
        title: 'Invoices',
        href: '/admin/invoices',
        icon: CreditCard,
      },
    ],
  },
  {
    title: 'User Management',
    icon: Users,
    items: [
      {
        title: 'All Users',
        href: '/admin/users',
        icon: Users,
      },
      {
        title: 'Add User',
        href: '/admin/add-user',
        icon: User2,
      },
      {
        title: 'User Roles',
        href: '/admin/user-roles',
        icon: User,
      },
    ],
  },
  {
    title: 'Project Management',
    icon: Building2,
    items: [
      {
        title: 'Jobsite Management',
        href: '/admin/jobsite-management',
        icon: MapPin,
      },
      {
        title: 'Material Takeoff',
        href: '/admin/material-takeoff',
        icon: Package,
      },
      {
        title: 'Material Requests',
        href: '/admin/material-requests',
        icon: Inbox,
      },
      {
        title: 'Timesheets',
        href: '/admin/timesheets',
        icon: Calendar,
      },
      {
        title: 'Progress Tracking',
        href: '/admin/progress-tracking',
        icon: BarChart3,
      },
      {
        title: 'Task Management',
        href: '/admin/task-management',
        icon: ListChecks,
      },
    ],
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

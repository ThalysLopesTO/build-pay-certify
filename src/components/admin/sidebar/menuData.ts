
import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Package,
  Settings,
  Shield,
  Truck,
  User,
  User2,
  Users,
  DollarSign,
  Clock,
  Receipt,
} from 'lucide-react';
import { MenuItem } from './types';

// Main menu items with proper organization
export const menuData: MenuItem[] = [
  // Dashboard
  {
    id: 'dashboard',
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  
  // Project Management
  {
    id: 'jobsites',
    title: 'Jobsite Management',
    href: '/admin/jobsites',
    icon: MapPin,
  },
  {
    id: 'material-takeoff',
    title: 'Material Takeoffs',
    href: '/takeoffs',
    icon: Package,
  },
  {
    id: 'material-requests',
    title: 'Material Requests',
    href: '/admin/material-requests',
    icon: Inbox,
  },
  {
    id: 'safety-templates',
    title: 'Safety Templates',
    href: '/admin/safety-templates',
    icon: Shield,
  },
  {
    id: 'inventory',
    title: 'Inventory',
    href: '/admin/inventory',
    icon: Package,
  },
  {
    id: 'suppliers',
    title: 'Suppliers',
    href: '/admin/suppliers',
    icon: Truck,
  },
  
  // Employee Management
  {
    id: 'employees',
    title: 'Employee Management',
    href: '/admin/employees',
    icon: Users,
  },
  {
    id: 'employee-registration',
    title: 'Employee Registration',
    href: '/admin/employee-registration',
    icon: User2,
  },
  {
    id: 'live-punch-monitor',
    title: 'Live Punch Monitor',
    href: '/admin/live-punch-monitor',
    icon: Clock,
  },
  
  // Management Operations
  {
    id: 'timesheets',
    title: 'Timesheets',
    href: '/admin/timesheets',
    icon: Calendar,
  },
  {
    id: 'payroll-summary',
    title: 'Payroll Summary',
    href: '/admin/payroll-summary',
    icon: DollarSign,
  },
  
  // Invoices & Financial
  {
    id: 'invoices',
    title: 'Invoices',
    href: '/admin/invoices',
    icon: FileText,
  },
  {
    id: 'quotes',
    title: 'Quotes',
    href: '/admin/quotes',
    icon: CreditCard,
  },
  {
    id: 'bills-expenses',
    title: 'Bills / Expenses',
    href: '/admin/bills-expenses',
    icon: Receipt,
  },
  
  // Reports & Communication
  {
    id: 'attention-reports',
    title: 'Attention Reports',
    href: '/admin/attention-reports',
    icon: Inbox,
  },
  
  // System
  {
    id: 'company-settings',
    title: 'Company Settings',
    href: '/admin/company-settings',
    icon: Building2,
  },
  {
    id: 'settings',
    title: 'User Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

// Group menu items by category for organized sidebar display
export const groupedMenuItems = {
  main: [
    menuData.find(item => item.id === 'dashboard')!
  ],
  management: [
    menuData.find(item => item.id === 'jobsites')!,
    menuData.find(item => item.id === 'material-takeoff')!,
    menuData.find(item => item.id === 'material-requests')!,
    menuData.find(item => item.id === 'safety-templates')!,
    menuData.find(item => item.id === 'inventory')!,
    menuData.find(item => item.id === 'suppliers')!,
  ],
  employees: [
    menuData.find(item => item.id === 'employees')!,
    menuData.find(item => item.id === 'employee-registration')!,
    menuData.find(item => item.id === 'live-punch-monitor')!,
  ],
  managementOps: [
    menuData.find(item => item.id === 'timesheets')!,
    menuData.find(item => item.id === 'payroll-summary')!,
  ],
  invoices: [
    menuData.find(item => item.id === 'invoices')!,
    menuData.find(item => item.id === 'quotes')!,
    menuData.find(item => item.id === 'bills-expenses')!,
  ],
  reports: [
    menuData.find(item => item.id === 'attention-reports')!,
  ],
  system: [
    menuData.find(item => item.id === 'company-settings')!,
    menuData.find(item => item.id === 'settings')!,
  ],
};

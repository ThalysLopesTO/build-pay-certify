
import {
  BarChart3,
  Building2,
  Calendar,
  CalendarDays,
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
  Archive,
  Briefcase,
  UserCog,
  Target,
  PieChart,
  MessageSquare,
  Cog,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import { MenuItem } from './types';

// Main menu items with proper organization
export const menuData: MenuItem[] = [
  // Dashboard
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
  },
  
  // Project Management
  {
    id: 'jobsites',
    title: 'Jobsite Management',
    icon: MapPin,
  },
  {
    id: 'tasks',
    title: 'Daily Tasks',
    icon: ListChecks,
  },
  {
    id: 'completed-jobsites',
    title: 'Completed Jobs',
    icon: Archive,
  },
  {
    id: 'material-takeoff',
    title: 'Material Takeoffs',
    icon: Package,
  },
  {
    id: 'material-requests',
    title: 'Material Requests',
    icon: Inbox,
  },
  {
    id: 'change-orders',
    title: 'Extras / Changes',
    icon: ClipboardList,
  },
  {
    id: 'safety-templates',
    title: 'Safety Templates',
    icon: Shield,
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: Package,
  },
  {
    id: 'suppliers',
    title: 'Suppliers',
    icon: Truck,
  },
  
  // Employee Management
  {
    id: 'employees',
    title: 'Employee Management',
    icon: Users,
  },
  {
    id: 'employee-registration',
    title: 'Employee Registration',
    icon: User2,
  },
  {
    id: 'live-punch-monitor',
    title: 'Live Punch Monitor',
    icon: Clock,
  },
  {
    id: 'time-summary',
    title: 'Time Summary',
    icon: BarChart3,
  },
  {
    id: 'time-requests',
    title: 'Time Requests',
    icon: Clock,
  },
  
  // Management Operations
  {
    id: 'manual-timesheets',
    title: 'Time Sheet',
    icon: ClipboardList,
  },
  {
    id: 'employee-bills',
    title: 'Employee Bills',
    icon: Receipt,
  },
  {
    id: 'timesheets',
    title: 'Timesheets',
    icon: Calendar,
  },
  {
    id: 'payroll-summary',
    title: 'Payroll Summary',
    icon: DollarSign,
  },
  
  // Invoices & Financial
  {
    id: 'clients',
    title: 'Clients',
    icon: Building2,
  },
  {
    id: 'invoices',
    title: 'Invoices',
    icon: FileText,
  },
  {
    id: 'quotes',
    title: 'Quotes',
    icon: CreditCard,
  },
  {
    id: 'bills-expenses',
    title: 'Bills / Expenses',
    icon: Receipt,
  },
  {
    id: 'job-costing',
    title: 'Job Costing / P&L',
    icon: TrendingUp,
  },
  
  // Reports & Communication
  {
    id: 'daily-reports',
    title: 'Daily Reports',
    icon: ClipboardList,
  },
  
  // System
  {
    id: 'company-settings',
    title: 'Company Settings',
    icon: Building2,
  },
  {
    id: 'settings',
    title: 'User Settings',
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
    menuData.find(item => item.id === 'tasks')!,
    menuData.find(item => item.id === 'material-takeoff')!,
    menuData.find(item => item.id === 'material-requests')!,
    menuData.find(item => item.id === 'change-orders')!,
    menuData.find(item => item.id === 'safety-templates')!,
    menuData.find(item => item.id === 'inventory')!,
    menuData.find(item => item.id === 'suppliers')!,
  ],
  employees: [
    menuData.find(item => item.id === 'employees')!,
    menuData.find(item => item.id === 'employee-registration')!,
    menuData.find(item => item.id === 'time-requests')!,
  ],
  managementOps: [
    menuData.find(item => item.id === 'live-punch-monitor')!,
    menuData.find(item => item.id === 'manual-timesheets')!,
    menuData.find(item => item.id === 'employee-bills')!,
  ],
  invoices: [
    menuData.find(item => item.id === 'job-costing')!,
    menuData.find(item => item.id === 'clients')!,
    menuData.find(item => item.id === 'invoices')!,
    menuData.find(item => item.id === 'quotes')!,
    menuData.find(item => item.id === 'bills-expenses')!,
  ],
  reports: [
    menuData.find(item => item.id === 'daily-reports')!,
  ],
  system: [
    menuData.find(item => item.id === 'company-settings')!,
    menuData.find(item => item.id === 'settings')!,
  ],
};

// Section configurations with icons and labels
export const sectionConfigs = {
  management: {
    label: 'Project Management',
    icon: Briefcase,
    storageKey: 'sidebar-project-management-expanded',
    defaultExpanded: true,
  },
  employees: {
    label: 'Employee Management',
    icon: UserCog,
    storageKey: 'sidebar-employee-management-expanded',
    defaultExpanded: false,
  },
  managementOps: {
    label: 'Management Operations',
    icon: Target,
    storageKey: 'sidebar-management-ops-expanded',
    defaultExpanded: false,
  },
  invoices: {
    label: 'Financial',
    icon: PieChart,
    storageKey: 'sidebar-financial-expanded',
    defaultExpanded: false,
  },
  reports: {
    label: 'Reports',
    icon: MessageSquare,
    storageKey: 'sidebar-reports-expanded',
    defaultExpanded: false,
  },
  system: {
    label: 'System Settings',
    icon: Cog,
    storageKey: 'sidebar-system-expanded',
    defaultExpanded: false,
  },
};

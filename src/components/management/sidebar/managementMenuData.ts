import {
  LayoutDashboard,
  Clock,
  Receipt,
  BarChart3,
  Settings,
  Package,
  Truck,
  CreditCard,
  FileText,
  Users,
  UserPlus,
  FileSpreadsheet,
  CheckSquare,
  Briefcase,
  UserCog,
  Target,
  PieChart,
  Cog,
  ClipboardCheck,
} from 'lucide-react';

// Organised to mirror the Admin sidebar structure (Project Management,
// Employee Management, Management Operations, Financial, Reports, System
// Settings), scoped to the routes a manager actually has. A small
// "My Workspace" section holds the manager-only personal time items that
// admins don't have. Notifications live in the header bell (as on Admin).
export const managementMenuItems = {
  main: [
    { title: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  ],
  projects: [
    { title: 'Daily Tasks', icon: CheckSquare, id: 'daily-tasks' },
    { title: 'Inventory',   icon: Package,      id: 'inventory' },
    { title: 'Suppliers',   icon: Truck,        id: 'suppliers' },
  ],
  employees: [
    { title: 'Employee Management',   icon: Users,    id: 'employees' },
    { title: 'Employee Registration', icon: UserPlus, id: 'employee-registration' },
    { title: 'Time Requests',         icon: Clock,    id: 'time-requests' },
  ],
  operations: [
    { title: 'Live Punch Monitor', icon: Clock,           id: 'live-punch-monitor' },
    { title: 'Time Sheet',         icon: FileSpreadsheet, id: 'manual-timesheets' },
    { title: 'Employee Bills',     icon: Receipt,         id: 'employee-bills' },
    { title: 'Site Inspections',   icon: ClipboardCheck,  id: 'site-inspections' },
    { title: 'Time Summary',       icon: BarChart3,       id: 'time-summary' },
  ],
  financial: [
    { title: 'Invoices',         icon: FileText,   id: 'invoices' },
    { title: 'Quotes',           icon: CreditCard, id: 'quotes' },
    { title: 'Bills & Expenses', icon: Receipt,    id: 'bills-expenses' },
  ],
  reports: [
    { title: 'Daily Reports', icon: FileText,   id: 'daily-reports' },
    { title: 'Reports',       icon: BarChart3,  id: 'reports' },
  ],
  personal: [
    { title: 'Time Clock',        icon: Clock,           id: 'time-tracker' },
    { title: 'My Timesheet',      icon: Clock,           id: 'my-timesheet' },
    { title: 'Timesheet History', icon: FileSpreadsheet, id: 'my-timesheet-history' },
  ],
  system: [
    { title: 'Settings', icon: Settings, id: 'settings' },
  ],
};

export const sectionConfigs = {
  projects: {
    label: 'Project Management',
    icon: Briefcase,
    defaultExpanded: true,
    storageKey: 'management-projects-expanded',
  },
  employees: {
    label: 'Employee Management',
    icon: UserCog,
    defaultExpanded: false,
    storageKey: 'management-employees-expanded',
  },
  operations: {
    label: 'Management Operations',
    icon: Target,
    defaultExpanded: false,
    storageKey: 'management-operations-expanded',
  },
  financial: {
    label: 'Financial',
    icon: PieChart,
    defaultExpanded: false,
    storageKey: 'management-financial-expanded',
  },
  reports: {
    label: 'Reports',
    icon: BarChart3,
    defaultExpanded: false,
    storageKey: 'management-reports-expanded',
  },
  personal: {
    label: 'My Workspace',
    icon: Clock,
    defaultExpanded: false,
    storageKey: 'management-personal-expanded',
  },
  system: {
    label: 'System Settings',
    icon: Cog,
    defaultExpanded: false,
    storageKey: 'management-system-expanded',
  },
};

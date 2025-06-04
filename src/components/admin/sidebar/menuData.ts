
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  MapPin, 
  FileText, 
  DollarSign, 
  Calendar,
  Package,
  Settings
} from 'lucide-react';

// Menu items grouped by category for regular admin users
export const groupedMenuItems = {
  main: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ],
  payroll: [
    { id: 'payroll-summary', label: 'Payroll Summary', icon: DollarSign },
    { id: 'employee-timesheets', label: 'Employee Timesheets', icon: Calendar },
  ],
  management: [
    { id: 'jobsite-management', label: 'Jobsite Management', icon: MapPin },
    { id: 'material-requests', label: 'Material Requests', icon: Package },
  ],
  employees: [
    { id: 'employee-management', label: 'Employee Management', icon: Users },
    { id: 'employee-registration', label: 'Employee Registration', icon: Users },
  ],
  invoices: [
    { id: 'invoice-management', label: 'Invoice Management', icon: FileText },
    { id: 'invoice-tracker', label: 'Invoice Tracker', icon: FileText },
    { id: 'project-billing', label: 'Project Billing', icon: Building },
  ],
  system: [
    { id: 'system-settings', label: 'System Settings', icon: Settings },
  ]
};

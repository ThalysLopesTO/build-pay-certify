
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  MapPin, 
  FileText, 
  DollarSign, 
  Calendar,
  Package,
  Settings,
  UserCheck,
  TrendingUp,
  Shield,
  Crown
} from 'lucide-react';

// Menu items grouped by category
export const groupedMenuItems = {
  main: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'super-admin', label: 'Super Admin Panel', icon: Crown, superAdminOnly: true },
  ],
  payroll: [
    { id: 'payroll-summary', label: 'Payroll Summary', icon: DollarSign },
    { id: 'employee-timesheets', label: 'Employee Timesheets', icon: Calendar },
  ],
  management: [
    { id: 'jobsite-management', label: 'Jobsite Management', icon: MapPin },
    { id: 'material-requests', label: 'Material Requests', icon: Package },
    { id: 'invoice-management', label: 'Invoice Management', icon: FileText },
    { id: 'invoice-tracker', label: 'Invoice Tracker', icon: TrendingUp },
  ],
  employees: [
    { id: 'employee-management', label: 'Employee Management', icon: Users },
    { id: 'employee-registration', label: 'Employee Registration', icon: UserCheck },
    { id: 'license-requests', label: 'License Requests', icon: Shield },
  ],
  operations: [
    { id: 'project-billing', label: 'Project Billing', icon: Building },
  ],
  system: [
    { id: 'company-settings', label: 'Company Settings', icon: Building },
    { id: 'system-settings', label: 'System Settings', icon: Settings },
  ]
};

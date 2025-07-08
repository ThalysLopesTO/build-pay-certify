import { 
  LayoutDashboard,
  Clock,
  DollarSign,
  Receipt,
  BarChart3,
  Settings
} from 'lucide-react';

export const managementMenuItems = {
  dashboard: [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      id: 'dashboard',
    },
  ],
  operations: [
    {
      title: 'Timesheet Approval',
      icon: Clock,
      id: 'timesheets',
    },
    {
      title: 'Payroll Summary',
      icon: DollarSign,
      id: 'payroll-summary',
    },
    {
      title: 'Bills & Expenses',
      icon: Receipt,
      id: 'bills-expenses',
    },
  ],
  reports: [
    {
      title: 'Reports',
      icon: BarChart3,
      id: 'reports',
    },
  ],
  account: [
    {
      title: 'Settings',
      icon: Settings,
      id: 'settings',
    },
  ],
};
import { 
  LayoutDashboard,
  Clock,
  DollarSign,
  Receipt,
  BarChart3,
  Settings,
  Package,
  Truck,
  CreditCard,
  FileText
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
      title: 'Live Punch Monitor',
      icon: Clock,
      id: 'live-punch-monitor',
    },
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
  inventory: [
    {
      title: 'Inventory',
      icon: Package,
      id: 'inventory',
    },
    {
      title: 'Suppliers',
      icon: Truck,
      id: 'suppliers',
    },
  ],
  financial: [
    {
      title: 'Quotes',
      icon: CreditCard,
      id: 'quotes',
    },
    {
      title: 'Invoices',
      icon: FileText,
      id: 'invoices',
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
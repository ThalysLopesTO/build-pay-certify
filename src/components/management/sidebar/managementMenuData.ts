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
  FileText,
  Users,
  UserPlus,
  Building2,
  UserCheck,
  TrendingUp,
  Wallet,
  FileSpreadsheet,
  Bell,
  CheckSquare
} from 'lucide-react';

export const managementMenuItems = {
  main: [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      id: 'dashboard',
    },
    {
      title: 'Notifications',
      icon: Bell,
      id: 'notifications',
    },
  ],
  operations: [
    {
      title: 'Time Clock (Punch In/Out)',
      icon: Clock,
      id: 'time-tracker',
    },
    {
      title: 'Daily Tasks',
      icon: CheckSquare,
      id: 'daily-tasks',
    },
    {
      title: 'Live Punch Monitor',
      icon: Clock,
      id: 'live-punch-monitor',
    },
    {
      title: 'Time Sheet',
      icon: FileSpreadsheet,
      id: 'manual-timesheets',
    },
    {
      title: 'Employee Bills',
      icon: Receipt,
      id: 'employee-bills',
    },
    {
      title: 'My Timesheet',
      icon: Clock,
      id: 'my-timesheet',
    },
    {
      title: 'Bills & Expenses',
      icon: Receipt,
      id: 'bills-expenses',
    },
  ],
  employees: [
    {
      title: 'Employee Management',
      icon: Users,
      id: 'employees',
    },
    {
      title: 'Employee Registration',
      icon: UserPlus,
      id: 'employee-registration',
    },
    {
      title: 'Time Requests',
      icon: Clock,
      id: 'time-requests',
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
      title: 'Clients',
      icon: Building2,
      id: 'clients',
    },
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
      title: 'My Timesheet History',
      icon: FileSpreadsheet,
      id: 'my-timesheet-history',
    },
    {
      title: 'Daily Reports',
      icon: FileText,
      id: 'daily-reports',
    },
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

export const sectionConfigs = {
  operations: {
    label: "Management Operations",
    icon: TrendingUp,
    defaultExpanded: true,
    storageKey: "management-operations-expanded"
  },
  employees: {
    label: "Employee Management",
    icon: UserCheck,
    defaultExpanded: false,
    storageKey: "management-employees-expanded"
  },
  inventory: {
    label: "Inventory Management",
    icon: Package,
    defaultExpanded: false,
    storageKey: "management-inventory-expanded"
  },
  financial: {
    label: "Financial",
    icon: Wallet,
    defaultExpanded: false,
    storageKey: "management-financial-expanded"
  },
  reports: {
    label: "Reports",
    icon: FileSpreadsheet,
    defaultExpanded: false,
    storageKey: "management-reports-expanded"
  },
  account: {
    label: "Account",
    icon: Settings,
    defaultExpanded: false,
    storageKey: "management-account-expanded"
  }
};
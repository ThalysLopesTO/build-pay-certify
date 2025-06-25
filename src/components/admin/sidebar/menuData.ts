
import { 
  BarChart3, 
  Users, 
  Building, 
  FileText, 
  Clock, 
  Package,
  Inbox,
  Settings,
  UserPlus,
  MapPin,
  CreditCard,
  Bell,
  Archive,
  Truck,
  Shield,
  Calculator,
  Eye
} from 'lucide-react';

export const groupedMenuItems = {
  main: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: BarChart3,
    }
  ],
  management: [
    {
      id: 'employees',
      title: 'Employee Management',
      icon: Users,
    },
    {
      id: 'employee-registration',
      title: 'Employee Registration',
      icon: UserPlus,
    },
    {
      id: 'jobsites',
      title: 'Jobsite Management',
      icon: MapPin,
    },
    {
      id: 'safety-templates',
      title: 'Safety Templates',
      icon: Shield,
      requiredRoles: ['admin', 'foreman', 'super_admin']
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: Archive,
    },
    {
      id: 'suppliers',
      title: 'Suppliers',
      icon: Truck,
    }
  ],
  payroll: [
    {
      id: 'live-punch-monitor',
      title: 'Live Punch Monitor',
      icon: Eye,
      requiredRoles: ['admin', 'super_admin']
    },
    {
      id: 'timesheets',
      title: 'Employee Timesheets',
      icon: Clock,
      requiredRoles: ['admin', 'super_admin']
    },
    {
      id: 'payroll-summary',
      title: 'Payroll Summary',
      icon: CreditCard,
    }
  ],
  employees: [
    {
      id: 'material-requests',
      title: 'Material Requests',
      icon: Package,
    },
    {
      id: 'attention-reports',
      title: 'Attention Reports',
      icon: Bell,
    }
  ],
  invoices: [
    {
      id: 'invoices',
      title: 'Invoice Management',
      icon: FileText,
    },
    {
      id: 'quotes',
      title: 'Quotes',
      icon: Calculator,
    }
  ],
  system: [
    {
      id: 'company-settings',
      title: 'Company Settings',
      icon: Building,
    },
    {
      id: 'settings',
      title: 'Account Settings',
      icon: Settings,
    }
  ]
};

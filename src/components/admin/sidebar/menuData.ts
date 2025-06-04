
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
  Bell
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
    }
  ],
  payroll: [
    {
      id: 'timesheets',
      title: 'Employee Timesheets',
      icon: Clock,
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

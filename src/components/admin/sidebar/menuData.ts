
import { 
  Home, 
  DollarSign, 
  Users, 
  UserPlus, 
  Package, 
  MapPin, 
  FileText, 
  Award, 
  Building, 
  Settings,
  Shield
} from 'lucide-react';

export const groupedMenuItems = {
  main: [
    { id: 'dashboard', label: 'Dashboard', icon: Home }
  ],
  payroll: [
    { id: 'payroll', label: 'Payroll Summary', icon: DollarSign }
  ],
  management: [
    { id: 'jobsites', label: 'Jobsite Management', icon: MapPin },
    { id: 'projects', label: 'Project Management', icon: Building },
    { id: 'invoices', label: 'Invoice Management', icon: FileText }
  ],
  employees: [
    { id: 'employees', label: 'Employee Management', icon: Users },
    { id: 'register', label: 'Employee Registration', icon: UserPlus },
    { id: 'certificates', label: 'Certificate Tracker', icon: Award }
  ],
  operations: [
    { id: 'materials', label: 'Material Requests', icon: Package }
  ],
  system: [
    { id: 'license-requests', label: 'License Requests', icon: Shield, superAdminOnly: true },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ]
};

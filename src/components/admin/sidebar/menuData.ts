
import { 
  DollarSign, 
  Users, 
  Building, 
  Settings, 
  Inbox, 
  MapPin, 
  UserPlus,
  Clock,
  Award,
  Home,
  FileText
} from 'lucide-react';
import { AdminMenuItem } from './types';

export const adminMenuItems: AdminMenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Home,
    section: 'main'
  },
  {
    id: 'payroll',
    title: 'Weekly Timesheets',
    icon: Clock,
    section: 'payroll'
  },
  {
    id: 'invoices',
    title: 'Invoice Management',
    icon: FileText,
    section: 'management'
  },
  {
    id: 'jobsites',
    title: 'Job Sites',
    icon: MapPin,
    section: 'operations'
  },
  {
    id: 'register',
    title: 'Add New Employee',
    icon: UserPlus,
    section: 'employees'
  },
  {
    id: 'employees',
    title: 'Employee Directory',
    icon: Users,
    section: 'employees'
  },
  {
    id: 'materials',
    title: 'Material Request Inbox',
    icon: Inbox,
    section: 'operations'
  },
  {
    id: 'certificates',
    title: 'Certificate Tracker',
    icon: Award,
    section: 'employees'
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: Building,
    section: 'operations'
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    section: 'system'
  }
];

export const groupedMenuItems = {
  main: adminMenuItems.filter(item => item.section === 'main'),
  payroll: adminMenuItems.filter(item => item.section === 'payroll'),
  management: adminMenuItems.filter(item => item.section === 'management'),
  employees: adminMenuItems.filter(item => item.section === 'employees'),
  operations: adminMenuItems.filter(item => item.section === 'operations'),
  system: adminMenuItems.filter(item => item.section === 'system')
};

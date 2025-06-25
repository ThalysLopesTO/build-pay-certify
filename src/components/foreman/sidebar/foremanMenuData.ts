
import { 
  Clock, 
  FileText, 
  Inbox, 
  Users, 
  BarChart3, 
  BookOpen, 
  Settings,
  Building
} from 'lucide-react';

export const foremanMenuItems = [
  {
    title: 'Timesheet',
    icon: Clock,
    id: 'timesheet',
  },
  {
    title: 'Material Request',
    icon: FileText,
    id: 'material-request',
  },
  {
    title: 'My Requests',
    icon: Inbox,
    id: 'my-requests',
  },
  {
    title: 'Employees',
    icon: Users,
    id: 'employees',
  },
  {
    title: 'Employee Reports',
    icon: BarChart3,
    id: 'employee-reports',
  },
  {
    title: 'Jobsite Progress',
    icon: Building,
    id: 'jobsite-progress',
  },
  {
    title: 'Company Rules',
    icon: BookOpen,
    id: 'company-rules',
  },
  {
    title: 'Settings',
    icon: Settings,
    id: 'settings',
  },
];

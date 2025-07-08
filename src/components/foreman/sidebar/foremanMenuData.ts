
import { 
  Clock, 
  FileText, 
  Inbox, 
  Users, 
  BarChart3, 
  BookOpen, 
  Settings,
  Building,
  Monitor
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
    title: 'Live Punch Monitor',
    icon: Monitor,
    id: 'live-punch-monitor',
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

// Group the menu items for the sidebar
export const groupedForemanItems = {
  timesheet: [
    {
      title: 'Timesheet',
      icon: Clock,
      id: 'timesheet',
    },
  ],
  materials: [
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
  ],
  team: [
    {
      title: 'Employees',
      icon: Users,
      id: 'employees',
    },
    {
      title: 'Live Punch Monitor',
      icon: Monitor,
      id: 'live-punch-monitor',
    },
    {
      title: 'Jobsite Progress',
      icon: Building,
      id: 'jobsite-progress',
    },
  ],
  reports: [
    {
      title: 'Employee Reports',
      icon: BarChart3,
      id: 'employee-reports',
    },
  ],
  company: [
    {
      title: 'Company Rules',
      icon: BookOpen,
      id: 'company-rules',
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

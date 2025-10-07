
import { 
  Clock, 
  FileText, 
  Inbox, 
  Users, 
  BarChart3, 
  BookOpen, 
  Settings,
  Building,
  Monitor,
  FolderClock,
  Package,
  UserCheck,
  FileBarChart,
  Shield,
  Home,
  ClipboardList,
  UserPlus
} from 'lucide-react';

export const foremanMenuItems = [
  {
    title: 'Dashboard',
    icon: Home,
    id: 'dashboard',
  },
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
    title: 'Inventory',
    icon: Package,
    id: 'inventory',
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
    title: 'Daily Reports',
    icon: ClipboardList,
    id: 'daily-reports',
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

export const groupedForemanItems = {
  dashboard: [
    {
      title: 'Dashboard',
      icon: Home,
      id: 'dashboard',
    },
  ],
  timesheet: [
    {
      title: 'Time Clock (Punch In/Out)',
      icon: Clock,
      id: 'time-tracker',
    },
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
    {
      title: 'Inventory',
      icon: Package,
      id: 'inventory',
    },
    {
      title: 'Extras / Changes',
      icon: ClipboardList,
      id: 'change-orders',
    },
  ],
  team: [
    {
      title: 'Employees',
      icon: Users,
      id: 'employees',
    },
    {
      title: 'Employee Registration',
      icon: UserPlus,
      id: 'employee-registration',
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
      title: 'My Timesheet History',
      icon: FolderClock,
      id: 'my-timesheet-history',
    },
    {
      title: 'Daily Reports',
      icon: ClipboardList,
      id: 'daily-reports',
    },
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

export const sectionConfigs = {
  dashboard: {
    label: "Dashboard",
    icon: Home,
    defaultExpanded: true,
    storageKey: "foreman-dashboard-expanded"
  },
  timesheet: {
    label: "Time Management",
    icon: FolderClock,
    defaultExpanded: false,
    storageKey: "foreman-timesheet-expanded"
  },
  materials: {
    label: "Material Management", 
    icon: Package,
    defaultExpanded: false,
    storageKey: "foreman-materials-expanded"
  },
  team: {
    label: "Team Management",
    icon: UserCheck,
    defaultExpanded: false,
    storageKey: "foreman-team-expanded"
  },
  reports: {
    label: "Reports",
    icon: FileBarChart,
    defaultExpanded: false,
    storageKey: "foreman-reports-expanded"
  },
  company: {
    label: "Company Information",
    icon: Shield,
    defaultExpanded: false,
    storageKey: "foreman-company-expanded"
  },
  account: {
    label: "Account",
    icon: Settings,
    defaultExpanded: false,
    storageKey: "foreman-account-expanded"
  }
};


import { 
  FileText, 
  Clock, 
  Package,
  Users,
  BookOpen,
  Settings,
  CheckSquare,
  BarChart3
} from 'lucide-react';

export const foremanMenuItems = [
  {
    id: 'timesheet',
    title: 'Submit Timesheet',
    icon: FileText,
  },
  {
    id: 'timesheet-approval',
    title: 'Timesheet Approval',
    icon: CheckSquare,
  },
  {
    id: 'material-request',
    title: 'Material Request',
    icon: Package,
  },
  {
    id: 'my-requests',
    title: 'My Requests',
    icon: Clock,
  },
  {
    id: 'employees',
    title: 'Employee Directory',
    icon: Users,
  },
  {
    id: 'company-rules',
    title: 'Company Rules',
    icon: BookOpen,
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
  }
];

// Grouped menu items for sidebar organization
export const groupedForemanItems = {
  timesheet: [
    {
      id: 'timesheet',
      title: 'Submit Timesheet',
      icon: FileText,
    },
    {
      id: 'timesheet-approval',
      title: 'Timesheet Approval',
      icon: CheckSquare,
    }
  ],
  materials: [
    {
      id: 'material-request',
      title: 'Material Request',
      icon: Package,
    },
    {
      id: 'my-requests',
      title: 'My Requests',
      icon: Clock,
    }
  ],
  team: [
    {
      id: 'employees',
      title: 'Employee Directory',
      icon: Users,
    }
  ],
  company: [
    {
      id: 'company-rules',
      title: 'Company Rules',
      icon: BookOpen,
    }
  ],
  reports: [
    // Empty for now, can be populated later if needed
  ],
  account: [
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
    }
  ]
};

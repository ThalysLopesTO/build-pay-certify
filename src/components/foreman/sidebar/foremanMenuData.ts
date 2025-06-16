
import { 
  Clock, 
  Users, 
  Package,
  Inbox,
  Bell,
  Settings,
  FileText
} from 'lucide-react';

export const foremanMenuItems = [
  {
    id: 'timesheet',
    title: 'Submit Timesheet',
    icon: Clock,
    section: 'timesheet'
  },
  {
    id: 'material-request',
    title: 'Request Material',
    icon: Package,
    section: 'materials'
  },
  {
    id: 'my-requests',
    title: 'My Material Requests',
    icon: Inbox,
    section: 'materials'
  },
  {
    id: 'employees',
    title: 'Employee Directory',
    icon: Users,
    section: 'team'
  },
  {
    id: 'company-rules',
    title: 'Company Rules',
    icon: FileText,
    section: 'company'
  },
  {
    id: 'attention-reports',
    title: 'Attention Reports',
    icon: Bell,
    section: 'reports'
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    section: 'account'
  }
];

export const groupedForemanItems = {
  timesheet: foremanMenuItems.filter(item => item.section === 'timesheet'),
  materials: foremanMenuItems.filter(item => item.section === 'materials'),
  team: foremanMenuItems.filter(item => item.section === 'team'),
  company: foremanMenuItems.filter(item => item.section === 'company'),
  reports: foremanMenuItems.filter(item => item.section === 'reports'),
  account: foremanMenuItems.filter(item => item.section === 'account')
};

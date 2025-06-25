
import { 
  FileText, 
  Clock, 
  Package,
  Users,
  BookOpen,
  Settings,
  CheckSquare
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

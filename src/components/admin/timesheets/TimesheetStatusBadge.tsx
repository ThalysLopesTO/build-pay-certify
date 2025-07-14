import { Badge } from '@/components/ui/badge';

interface TimesheetStatusBadgeProps {
  status: string;
}

const TimesheetStatusBadge: React.FC<TimesheetStatusBadgeProps> = ({ status }) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return <Badge variant="default" className="bg-green-500">Approved</Badge>;
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default TimesheetStatusBadge;
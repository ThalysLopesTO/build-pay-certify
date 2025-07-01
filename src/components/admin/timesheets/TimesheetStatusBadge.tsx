
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TimesheetStatusBadgeProps {
  status: string;
}

const TimesheetStatusBadge: React.FC<TimesheetStatusBadgeProps> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getStatusColor(status)} className="capitalize">
      {status}
    </Badge>
  );
};

export default TimesheetStatusBadge;

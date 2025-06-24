
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TimesheetStatusBadgeProps {
  status: string;
}

const TimesheetStatusBadge: React.FC<TimesheetStatusBadgeProps> = ({ status }) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 border-red-200">❌ Rejected</Badge>;
    case 'edited':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">✏️ Edited</Badge>;
    case 'pending':
    default:
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">🟡 Pending</Badge>;
  }
};

export default TimesheetStatusBadge;

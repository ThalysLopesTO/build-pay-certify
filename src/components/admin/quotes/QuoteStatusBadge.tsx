
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface QuoteStatusBadgeProps {
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';
}

const QuoteStatusBadge: React.FC<QuoteStatusBadgeProps> = ({ status }) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'default'; // Green
      case 'sent':
        return 'secondary'; // Blue
      case 'declined':
        return 'destructive'; // Red
      case 'invoiced':
        return 'default'; // Green (similar to accepted)
      case 'draft':
        return 'outline'; // Gray
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'sent':
        return 'Sent';
      case 'declined':
        return 'Declined';
      case 'invoiced':
        return 'Invoiced';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getStatusVariant(status)}>
      {getStatusText(status)}
    </Badge>
  );
};

export default QuoteStatusBadge;

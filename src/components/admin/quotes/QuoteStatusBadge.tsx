
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
        return 'Approved';
      case 'sent':
        return 'Sent';
      case 'declined':
        return 'Rejected';
      case 'invoiced':
        return 'Invoiced';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return '✓';
      case 'sent':
        return '↗';
      case 'declined':
        return '✗';
      case 'invoiced':
        return '📄';
      case 'draft':
        return '📝';
      default:
        return '';
    }
  };

  return (
    <Badge 
      variant={getStatusVariant(status)} 
      className={`font-medium ${status === 'accepted' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : ''}`}
    >
      <span className="mr-1">{getStatusIcon(status)}</span>
      {getStatusText(status)}
    </Badge>
  );
};

export default QuoteStatusBadge;

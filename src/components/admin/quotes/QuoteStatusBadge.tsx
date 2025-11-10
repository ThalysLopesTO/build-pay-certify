import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle, XCircle, FileEdit } from 'lucide-react';

interface QuoteStatusBadgeProps {
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';
  publicStatus?: 'awaiting_response' | 'changes_requested' | 'approved' | 'declined';
}

const QuoteStatusBadge: React.FC<QuoteStatusBadgeProps> = ({ status, publicStatus }) => {
  const displayStatus = publicStatus || status;

  const getStatusConfig = () => {
    switch (displayStatus) {
      case 'awaiting_response':
        return {
          label: 'Awaiting Response',
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800',
        };
      case 'changes_requested':
        return {
          label: 'Changes Requested',
          icon: AlertCircle,
          className: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800',
        };
      case 'approved':
        return {
          label: 'Approved',
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800',
        };
      case 'declined':
        return {
          label: 'Declined',
          icon: XCircle,
          className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
        };
      case 'draft':
        return {
          label: 'Draft',
          icon: FileEdit,
          className: 'bg-muted text-muted-foreground border-border hover:bg-muted',
        };
      case 'sent':
        return {
          label: 'Sent',
          icon: Clock,
          className: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
        };
      case 'invoiced':
        return {
          label: 'Invoiced',
          icon: CheckCircle,
          className: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
        };
      default:
        return {
          label: status,
          icon: FileEdit,
          className: 'bg-muted text-muted-foreground border-border hover:bg-muted',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`font-medium border ${config.className} flex items-center gap-1.5 px-3 py-1`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
};

export default QuoteStatusBadge;

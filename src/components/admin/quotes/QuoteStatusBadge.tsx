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
          className: 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
        };
      case 'changes_requested':
        return {
          label: 'Changes Requested',
          icon: AlertCircle,
          className: 'bg-orange-100/80 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
        };
      case 'approved':
        return {
          label: 'Approved',
          icon: CheckCircle,
          className: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        };
      case 'declined':
        return {
          label: 'Declined',
          icon: XCircle,
          className: 'bg-red-100/80 text-red-700 dark:bg-red-500/20 dark:text-red-400',
        };
      case 'draft':
        return {
          label: 'Draft',
          icon: FileEdit,
          className: 'bg-slate-100/80 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
        };
      case 'sent':
        return {
          label: 'Sent',
          icon: Clock,
          className: 'bg-blue-100/80 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        };
      case 'invoiced':
        return {
          label: 'Invoiced',
          icon: CheckCircle,
          className: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        };
      default:
        return {
          label: status,
          icon: FileEdit,
          className: 'bg-slate-100/80 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      className={`font-medium ${config.className} flex items-center gap-1.5 px-3 py-1.5 rounded-full border-0`}
    >
      <Icon className="h-3 w-3" />
      <span className="text-xs">{config.label}</span>
    </Badge>
  );
};

export default QuoteStatusBadge;

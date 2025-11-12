import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle, XCircle, FileEdit } from 'lucide-react';

interface QuoteStatusBadgeProps {
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';
  publicStatus?: 'awaiting_response' | 'changes_requested' | 'approved' | 'declined';
  compact?: boolean;
}

const QuoteStatusBadge: React.FC<QuoteStatusBadgeProps> = ({ status, publicStatus, compact = false }) => {
  const displayStatus = publicStatus || status;

  const getStatusConfig = () => {
    switch (displayStatus) {
      case 'awaiting_response':
        return {
          label: 'Awaiting Response',
          icon: Clock,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50',
        };
      case 'changes_requested':
        return {
          label: 'Changes Requested',
          icon: AlertCircle,
          className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50',
        };
      case 'approved':
        return {
          label: 'Approved',
          icon: CheckCircle,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
        };
      case 'declined':
        return {
          label: 'Declined',
          icon: XCircle,
          className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
        };
      case 'draft':
        return {
          label: 'Draft',
          icon: FileEdit,
          className: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50',
        };
      case 'sent':
        return {
          label: 'Sent',
          icon: Clock,
          className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
        };
      case 'invoiced':
        return {
          label: 'Invoiced',
          icon: CheckCircle,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
        };
      default:
        return {
          label: status,
          icon: FileEdit,
          className: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`font-medium border ${config.className} flex items-center gap-1.5 ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1'
      }`}
    >
      <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {config.label}
    </Badge>
  );
};

export default QuoteStatusBadge;

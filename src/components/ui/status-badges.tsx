import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Standardized status badge variants
export const StatusBadge: React.FC<{
  status: string;
  type?: 'material' | 'punch' | 'timesheet' | 'invoice' | 'report';
  className?: string;
}> = ({ status, type = 'material', className }) => {
  const getVariantAndColor = () => {
    const normalizedStatus = status.toLowerCase().trim();
    
    // Material Request statuses
    if (type === 'material') {
      switch (normalizedStatus) {
        case 'pending':
          return { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
        case 'ordered':
          return { variant: 'default' as const, color: 'bg-blue-100 text-blue-800 border-blue-200' };
        case 'delivered':
          return { variant: 'default' as const, color: 'bg-green-100 text-green-800 border-green-200' };
        case 'archived':
          return { variant: 'outline' as const, color: 'bg-gray-100 text-gray-600 border-gray-200' };
        default:
          return { variant: 'secondary' as const, color: '' };
      }
    }
    
    // Punch/Timesheet statuses  
    if (type === 'punch' || type === 'timesheet') {
      switch (normalizedStatus) {
        case 'in':
        case 'clocked in':
        case 'active':
          return { variant: 'default' as const, color: 'bg-green-500 text-white' };
        case 'out':
        case 'clocked out':
        case 'completed':
          return { variant: 'default' as const, color: 'bg-green-600 text-white' };
        case 'edited':
          return { variant: 'default' as const, color: 'bg-orange-100 text-orange-800 border-orange-200' };
        case 'missed':
          return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800 border-red-200' };
        default:
          return { variant: 'secondary' as const, color: '' };
      }
    }
    
    // Invoice statuses
    if (type === 'invoice') {
      switch (normalizedStatus) {
        case 'pending':
          return { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
        case 'sent':
          return { variant: 'default' as const, color: 'bg-blue-100 text-blue-800 border-blue-200' };
        case 'paid':
          return { variant: 'default' as const, color: 'bg-green-100 text-green-800 border-green-200' };
        case 'overdue':
          return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800 border-red-200' };
        default:
          return { variant: 'secondary' as const, color: '' };
      }
    }
    
    // Report statuses
    if (type === 'report') {
      switch (normalizedStatus) {
        case 'pending':
          return { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
        case 'reviewed':
          return { variant: 'default' as const, color: 'bg-green-100 text-green-800 border-green-200' };
        default:
          return { variant: 'secondary' as const, color: '' };
      }
    }
    
    // Default fallback
    return { variant: 'secondary' as const, color: '' };
  };

  const { variant, color } = getVariantAndColor();

  return (
    <Badge 
      variant={variant}
      className={cn(
        color,
        'font-medium px-2 py-1 text-xs',
        className
      )}
    >
      {status}
    </Badge>
  );
};

// Convenience components for specific use cases
export const MaterialStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge status={status} type="material" className={className} />
);

export const PunchStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge status={status} type="punch" className={className} />
);

export const TimesheetStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge status={status} type="timesheet" className={className} />
);

export const InvoiceStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge status={status} type="invoice" className={className} />
);

export const ReportStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge status={status} type="report" className={className} />
);
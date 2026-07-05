import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Eye, Mail, Download, MoreVertical, Trash2, CheckCircle, Clock, AlertCircle, Pencil } from 'lucide-react';
import { Invoice } from '../types/invoice';
import { format } from 'date-fns';

interface InvoiceTrackerMobileCardProps {
  invoice: Invoice;
  onView: (id: string) => void;
  onEmail: (invoice: Invoice) => void;
  onStatusChange: (id: string, status: 'pending' | 'paid' | 'expired') => void;
  onDownload: (invoice: Invoice) => void;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
}

const InvoiceTrackerMobileCard: React.FC<InvoiceTrackerMobileCardProps> = ({
  invoice,
  onView,
  onEmail,
  onStatusChange,
  onDownload,
  onEdit,
  onDelete,
}) => {
  const isOverdue = invoice.status === 'pending' && new Date(invoice.due_date) < new Date();

  const getStatusBadge = () => {
    if (isOverdue) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    }
    
    switch (invoice.status) {
      case 'paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {invoice.status}
          </Badge>
        );
    }
  };

  return (
    <Card className={`p-4 ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{invoice.invoice_number}</span>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {invoice.client_company}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onStatusChange(invoice.id, 'paid')}>
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                Mark as Paid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(invoice.id, 'pending')}>
                <Clock className="h-4 w-4 mr-2 text-amber-600" />
                Mark as Pending
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(invoice)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Invoice
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <p className="text-sm text-foreground line-clamp-1">{invoice.title}</p>

        {/* Amount and Due Date */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">
            ${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-muted-foreground">
            Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(invoice.id)}
            className="flex-1 h-9"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEmail(invoice)}
            className="flex-1 h-9"
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(invoice)}
            className="h-9 px-3"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default InvoiceTrackerMobileCard;

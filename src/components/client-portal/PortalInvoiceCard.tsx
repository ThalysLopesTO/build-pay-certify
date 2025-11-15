import { format } from 'date-fns';
import { Receipt, Calendar, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PortalInvoiceCardProps {
  invoice: {
    id: string;
    invoice_number: string;
    title: string;
    due_date: string;
    status: string;
    total_amount: number;
    sent_date: string | null;
    notes: string | null;
  };
}

export function PortalInvoiceCard({ invoice }: PortalInvoiceCardProps) {
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'bg-orange-500 hover:bg-orange-600',
      paid: 'bg-green-500 hover:bg-green-600',
      expired: 'bg-red-500 hover:bg-red-600',
    };
    return statusMap[status] || 'bg-gray-500 hover:bg-gray-600';
  };

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === 'pending';

  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-lg hover:scale-[1.02] transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
          </div>
          <p className="text-foreground font-medium mb-1">{invoice.title}</p>
          {invoice.sent_date && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Sent {format(new Date(invoice.sent_date), 'MMM d, yyyy')}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Badge className={`${getStatusColor(invoice.status)} text-white border-0`}>
            {invoice.status}
          </Badge>
          {isOverdue && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
              Overdue
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between py-4 border-t border-b mb-4">
        <div className="text-sm text-muted-foreground">Total amount</div>
        <div className="text-2xl font-bold">${invoice.total_amount.toFixed(2)}</div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Due date</span>
        <span className={`font-medium ${isOverdue ? 'text-red-500' : ''}`}>
          {format(new Date(invoice.due_date), 'MMM d, yyyy')}
        </span>
      </div>
    </div>
  );
}

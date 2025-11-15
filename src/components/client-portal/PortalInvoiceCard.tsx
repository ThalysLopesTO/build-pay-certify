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
      pending: 'bg-yellow-500',
      paid: 'bg-green-500',
      expired: 'bg-red-500',
    };
    return statusMap[status] || 'bg-gray-500';
  };

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === 'pending';

  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
          </div>
          <p className="text-muted-foreground">{invoice.title}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive">Overdue</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="font-semibold">${invoice.total_amount.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

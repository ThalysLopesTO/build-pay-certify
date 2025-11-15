import { format } from 'date-fns';
import { Receipt, Calendar, MapPin } from 'lucide-react';
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
    client_address: string | null;
    subtotal: number;
    tax: number | null;
    discount: number | null;
  };
}

export function PortalInvoiceCard({ invoice }: PortalInvoiceCardProps) {
  const getStatusColor = (status: string) => {
    if (status === 'paid') return 'bg-green-600';
    if (status === 'expired' || isOverdue) return 'bg-red-600';
    return 'bg-orange-600';
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
          {invoice.client_address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3" />
              {invoice.client_address}
            </p>
          )}
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

      <div className="space-y-2 py-4 border-t border-b">
        {invoice.subtotal > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
          </div>
        )}
        {invoice.discount && invoice.discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-medium text-green-600">-${invoice.discount.toFixed(2)}</span>
          </div>
        )}
        {invoice.tax && invoice.tax > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">${invoice.tax.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Total amount</span>
          <span className="text-2xl font-bold">${invoice.total_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Due date</p>
        <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
          {format(new Date(invoice.due_date), 'MMM d, yyyy')}
          {isOverdue && ' (Overdue)'}
        </p>
      </div>
    </div>
  );
}

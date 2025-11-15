import { useParams, useNavigate } from 'react-router-dom';
import { useClientPortalContext } from '@/contexts/ClientPortalContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function PortalInvoiceDetailPage() {
  const { invoiceId } = useParams();
  const { invoices, token } = useClientPortalContext();
  const navigate = useNavigate();

  const invoice = invoices.find(i => i.id === invoiceId);

  if (!invoice) {
    return (
      <div className="text-center py-12 pt-16 lg:pt-12">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button onClick={() => navigate(`/client/${token}/invoices`)} className="mt-4">
          Back to Invoices
        </Button>
      </div>
    );
  }

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === 'pending';

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/client/${token}/invoices`)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Invoices
      </Button>

      {/* Invoice Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl mb-2">{invoice.invoice_number}</CardTitle>
              <p className="text-lg md:text-xl font-semibold text-muted-foreground">
                {invoice.title}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                {invoice.status}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">Overdue</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoice.sent_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sent:</span>
                <span className="font-medium">
                  {format(new Date(invoice.sent_date), 'MMM d, yyyy')}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Due:</span>
              <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                {format(new Date(invoice.due_date), 'MMM d, yyyy')}
              </span>
            </div>
            
            {invoice.client_address && (
              <div className="flex items-start gap-2 text-sm md:col-span-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium">{invoice.client_address}</span>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="pt-4 border-t space-y-3">
            {invoice.subtotal > 0 && (
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
              </div>
            )}
            {invoice.discount && invoice.discount > 0 && (
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-green-600">
                  -${invoice.discount.toFixed(2)}
                </span>
              </div>
            )}
            {invoice.tax && invoice.tax > 0 && (
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">${invoice.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t">
              <span className="text-base md:text-lg font-semibold">Total Amount</span>
              <span className="text-2xl md:text-3xl font-bold text-primary">
                ${invoice.total_amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientPortalContext } from '@/contexts/ClientPortalContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Download, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { generatePortalInvoicePDF } from '@/utils/portalInvoicePDFGenerator';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export default function PortalInvoiceDetailPage() {
  const { invoiceId } = useParams();
  const { invoices, token, company_settings } = useClientPortalContext();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const isMobile = useIsMobile();

  const invoice = invoices.find(i => i.id === invoiceId);

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    setIsDownloading(true);
    try {
      await generatePortalInvoicePDF(invoice, company_settings);
      toast({
        title: "PDF Downloaded",
        description: `Invoice ${invoice.invoice_number} has been downloaded.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

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

  const InvoiceSummaryCard = () => (
    <Card className={isMobile ? '' : 'sticky top-6'}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Invoice Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Status</p>
          <div className="flex gap-2">
            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
              {invoice.status}
            </Badge>
            {isOverdue && <Badge variant="destructive">Overdue</Badge>}
          </div>
        </div>

        {/* Amount Due */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {invoice.status === 'paid' ? 'Amount Paid' : 'Amount Due'}
          </p>
          <p className="text-3xl font-bold text-primary">
            ${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Due Date */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Due Date</p>
          <p className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
            {format(new Date(invoice.due_date), 'MMM d, yyyy')}
          </p>
        </div>

        {/* Pay Invoice Button */}
        <div className="pt-2 space-y-2">
          <Button className="w-full" size="lg" disabled>
            <Lock className="w-4 h-4 mr-2" />
            Pay Invoice
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Payments are not enabled by this company.
          </p>
          <p className="text-xs text-muted-foreground text-center opacity-70">
            Secure payments powered by Stripe.
          </p>
        </div>
      </CardContent>
    </Card>
  );

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

      {/* Two Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Invoice Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mobile-only: Summary Card at top */}
          {isMobile && <InvoiceSummaryCard />}

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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                </Button>
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
                  <span className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
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

              {/* Line Items Table */}
              {invoice.line_items && invoice.line_items.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">Item Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-3 font-semibold">Description</th>
                          <th className="text-right p-3 font-semibold">Unit Price</th>
                          <th className="text-right p-3 font-semibold">Qty</th>
                          <th className="text-right p-3 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.line_items.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                            <td className="p-3">{item.description}</td>
                            <td className="text-right p-3">${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="text-right p-3">{item.quantity}</td>
                            <td className="text-right p-3 font-medium">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="pt-4 border-t space-y-3">
                {invoice.subtotal > 0 && (
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {invoice.discount && invoice.discount > 0 && (
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-green-600">
                      -${invoice.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-muted-foreground">Tax ({invoice.tax_rate.toFixed(2)}%)</span>
                    <span className="font-medium">+${invoice.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-base md:text-lg font-semibold">Total Amount</span>
                  <span className="text-2xl md:text-3xl font-bold text-primary">
                    ${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

        {/* Right Column - Sticky Sidebar (Desktop only) */}
        {!isMobile && (
          <div className="lg:col-span-1">
            <InvoiceSummaryCard />
          </div>
        )}
      </div>
    </div>
  );
}

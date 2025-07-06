import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useInvoices } from '@/hooks/useInvoices';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const InvoicePreview = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { user } = useAuth();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { settings: companySettings, isLoading: settingsLoading } = useCompanySettings();

  // Check if user is admin
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (invoicesLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  const invoice = invoices.find(inv => inv.id === invoiceId);
  
  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Invoice Not Found</h2>
          <p className="text-muted-foreground">The requested invoice could not be found.</p>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const goBack = () => {
    window.history.back();
  };

  const subtotal = invoice.subtotal || 0;
  const discount = invoice.discount || 0;
  const tax = invoice.tax || 0;
  const discountAmount = subtotal * (discount / 100);
  const taxAmount = (subtotal - discountAmount) * (tax / 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with actions - hidden when printing */}
      <div className="print:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button variant="outline" onClick={goBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-8 bg-white dark:bg-white print:bg-white print:shadow-none">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              {companySettings?.company_logo_url ? (
                <img 
                  src={companySettings.company_logo_url} 
                  alt="Company Logo" 
                  className="h-16 w-auto"
                />
              ) : (
                <div className="h-16 w-32 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Logo</span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                <div className="font-semibold text-gray-900">{companySettings?.company_name || 'Company Name'}</div>
                {companySettings?.company_address && (
                  <div className="mt-1">{companySettings.company_address}</div>
                )}
                {companySettings?.company_email && (
                  <div>{companySettings.company_email}</div>
                )}
                {companySettings?.company_phone && (
                  <div>{companySettings.company_phone}</div>
                )}
              </div>
            </div>
            
            <div className="text-right space-y-1">
              <div className="text-2xl font-bold text-gray-900">INVOICE</div>
              <div className="text-sm text-gray-600">
                <div><span className="font-medium">Invoice #:</span> {invoice.invoice_number}</div>
                <div><span className="font-medium">Date:</span> {format(new Date(invoice.created_at), 'MMM dd, yyyy')}</div>
                <div><span className="font-medium">Due Date:</span> {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">BILL TO:</div>
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-900">{invoice.client_company}</div>
                <div>{invoice.client_email}</div>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">PROJECT:</div>
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-900">{invoice.title}</div>
                {invoice.jobsites?.name && (
                  <div>Jobsite: {invoice.jobsites.name}</div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.invoice_line_items?.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ${item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invoice Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount ({discount}%):</span>
                  <span className="text-gray-900">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({tax}%):</span>
                  <span className="text-gray-900">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total:</span>
                  <span className="text-base font-semibold text-gray-900">${invoice.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms / Notes */}
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-2">PAYMENT TERMS:</div>
                  <div className="text-sm text-gray-600">
                    Payment is due within 30 days of invoice date.
                  </div>
                </div>
                
                {companySettings?.hst_number && (
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">TAX ID:</div>
                    <div className="text-sm text-gray-600">
                      {companySettings.hst_number}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {invoice.notes && (
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2">NOTES:</div>
                <div className="text-sm text-gray-600">
                  {invoice.notes}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6">
              <div className="text-center text-sm text-gray-600">
                Thank you for your business!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
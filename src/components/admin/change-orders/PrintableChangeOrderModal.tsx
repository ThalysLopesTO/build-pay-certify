import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, X } from 'lucide-react';
import { ChangeOrder } from '@/hooks/useChangeOrders';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useChangeOrderPDF } from '@/hooks/useChangeOrderPDF';
import EmployeeAvatar from '@/components/ui/employee-avatar';

interface PrintableChangeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ChangeOrder;
  jobsiteName: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Pending Review',
  approved: 'Approved',
  rejected: 'Declined',
  completed: 'Completed',
};

const formatCurrency = (amount?: number) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const PrintableChangeOrderModal: React.FC<PrintableChangeOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  jobsiteName,
}) => {
  const { settings } = useCompanySettings();
  const { generateChangeOrderPDF } = useChangeOrderPDF();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      await generateChangeOrderPDF({
        changeOrder: order,
        jobsiteName,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle>Change Order Details</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Content */}
        <div className="space-y-6 print:space-y-4">
          {/* Header */}
          <div className="text-center border-b border-border pb-4 print:pb-2">
            <h1 className="text-2xl font-bold text-foreground print:text-black">
              {settings?.company_name || 'Company Name'}
            </h1>
            <p className="text-sm text-muted-foreground print:text-gray-600">
              Change Order Request
            </p>
          </div>

          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2 print:text-black">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground print:text-gray-600">Title:</span>
                    <span className="font-medium print:text-black">{order.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground print:text-gray-600">Type:</span>
                    <span className="font-medium print:text-black">
                      {order.type === 'admin' ? 'Official Change Order' : 'Foreman Request'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground print:text-gray-600">Status:</span>
                    <Badge className={`print:border print:bg-white print:text-black ${statusColors[order.status]}`}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground print:text-gray-600">Cost:</span>
                    <span className="font-semibold text-lg print:text-black">
                      {formatCurrency(order.cost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2 print:text-black">Project Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground print:text-gray-600">Jobsite:</span>
                    <span className="font-medium print:text-black">{jobsiteName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground print:text-gray-600">Created:</span>
                    <span className="font-medium print:text-black">{formatDate(order.created_at)}</span>
                  </div>
                  {order.updated_at !== order.created_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground print:text-gray-600">Last Updated:</span>
                      <span className="font-medium print:text-black">{formatDate(order.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="print:border-gray-300" />

          {/* Description */}
          <div>
            <h3 className="font-semibold text-lg mb-3 print:text-black">Description</h3>
            <div className="bg-muted p-4 rounded-lg print:bg-gray-50 print:border print:border-gray-200">
              <p className="text-sm leading-relaxed whitespace-pre-wrap print:text-black">
                {order.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Creator Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3 print:text-black">Submitted By</h3>
            <div className="flex items-center gap-3">
              <EmployeeAvatar
                photoUrl={order.creator?.photo_url}
                firstName={order.creator?.first_name}
                lastName={order.creator?.last_name}
                size="md"
              />
              <div>
                <p className="font-medium print:text-black">
                  {order.creator ? `${order.creator.first_name} ${order.creator.last_name}` : 'Unknown Creator'}
                </p>
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  Employee
                </p>
              </div>
            </div>
          </div>

          {/* Timeline - only show if we have update/creation dates to display */}
          <Separator className="print:border-gray-300" />
          <div>
            <h3 className="font-semibold text-lg mb-3 print:text-black">Status Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground print:text-gray-600">Current Status:</span>
                <p className="font-medium capitalize print:text-black">{statusLabels[order.status] || order.status}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground print:text-gray-600">Type:</span>
                <p className="font-medium print:text-black">
                  {order.type === 'admin' ? 'Official Change Order' : 'Foreman Request'}
                </p>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {order.attachments && order.attachments.length > 0 && (
            <>
              <Separator className="print:border-gray-300" />
              <div>
                <h3 className="font-semibold text-lg mb-3 print:text-black">Attachments</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                  {order.attachments.map((attachment, index) => (
                    <div key={index} className="border border-border rounded-lg overflow-hidden">
                      <img
                        src={attachment}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground hidden print:block print:text-gray-600">
                  {order.attachments.length} attachment(s) included with this change order.
                </p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="text-center pt-6 border-t border-border print:pt-4 print:border-gray-300">
            <p className="text-xs text-muted-foreground print:text-gray-500">
              Generated on {new Date().toLocaleDateString('en-CA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintableChangeOrderModal;
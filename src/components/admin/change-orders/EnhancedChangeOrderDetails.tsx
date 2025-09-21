import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Calendar, User, MapPin, DollarSign, FileText, Image as ImageIcon } from 'lucide-react';
import { ChangeOrder } from '@/hooks/useChangeOrders';
import { useChangeOrderPDF } from '@/hooks/useChangeOrderPDF';

interface EnhancedChangeOrderDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  order: ChangeOrder;
  jobsites: any[];
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Pending',
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

const EnhancedChangeOrderDetails = ({
  isOpen,
  onClose,
  order,
  jobsites,
}: EnhancedChangeOrderDetailsProps) => {
  const { generateChangeOrderPDF } = useChangeOrderPDF();

  const getJobsiteName = (projectId: string) => {
    const jobsite = jobsites.find(j => j.id === projectId);
    return jobsite?.name || 'Unknown Jobsite';
  };

  const handleDownloadPDF = async () => {
    try {
      await generateChangeOrderPDF({
        changeOrder: order,
        jobsiteName: getJobsiteName(order.project_id),
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-2xl">{order.title}</SheetTitle>
              <Badge className={statusColors[order.status] || statusColors.draft}>
                {statusLabels[order.status] || order.status}
              </Badge>
            </div>
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Project Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Project Information
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jobsite</p>
                <p className="text-base">{getJobsiteName(order.project_id)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="text-base">
                  {order.type === 'admin' ? 'Official Change Order' : 'Foreman Request'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Description
            </h3>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-base whitespace-pre-wrap">{order.description}</p>
            </div>
          </div>

          {/* Cost Information */}
          {order.cost && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Information
              </h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(order.cost)}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {(order.start_date || order.end_date) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                {order.start_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-base">{formatDate(order.start_date)}</p>
                  </div>
                )}
                {order.end_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="text-base">{formatDate(order.end_date)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Creator Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Creator Information
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p className="text-base">
                  {order.creator ? `${order.creator.first_name} ${order.creator.last_name}` : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created On</p>
                <p className="text-base">{formatDate(order.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Review Information */}
          {(order.reviewed_by || order.reviewed_at) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review Information</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                {order.reviewer && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reviewed By</p>
                    <p className="text-base">
                      {`${order.reviewer.first_name} ${order.reviewer.last_name}`}
                    </p>
                  </div>
                )}
                {order.reviewed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reviewed On</p>
                    <p className="text-base">{formatDate(order.reviewed_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {order.attachments && order.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Attachments ({order.attachments.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {order.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border"
                    onClick={() => window.open(attachment, '_blank')}
                  >
                    <img
                      src={attachment}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EnhancedChangeOrderDetails;
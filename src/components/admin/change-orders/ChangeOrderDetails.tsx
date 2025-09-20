import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChangeOrder } from '@/hooks/useChangeOrders';
import { format } from 'date-fns';
import { Calendar, DollarSign, User, FileText } from 'lucide-react';

interface ChangeOrderDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  order: ChangeOrder;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-purple-100 text-purple-800',
};

const ChangeOrderDetails = ({ isOpen, onClose, order }: ChangeOrderDetailsProps) => {
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {order.title}
            <Badge className={statusColors[order.status]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {order.type === 'admin' ? 'Official Change Order' : 'Foreman Request'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Project Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Project Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Project:</span>
                <span>{order.project?.name || 'Unknown Project'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <p className="text-sm bg-muted p-3 rounded-lg">
              {order.description}
            </p>
          </div>

          <Separator />

          {/* Cost and Timeline */}
          {order.type === 'admin' && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3">Cost & Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Cost:</span>
                    <span>{formatCurrency(order.cost)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Start:</span>
                    <span>{formatDate(order.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">End:</span>
                    <span>{formatDate(order.end_date)}</span>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Timeline for foreman requests */}
          {order.type === 'foreman_request' && (order.start_date || order.end_date) && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3">Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Start:</span>
                    <span>{formatDate(order.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">End:</span>
                    <span>{formatDate(order.end_date)}</span>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Creator Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Creator Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Created by:</span>
                <span>
                  {order.creator ? 
                    `${order.creator.first_name} ${order.creator.last_name}` : 
                    'Unknown User'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Created on:</span>
                <span>{format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Review Information */}
          {order.reviewed_by && order.reviewed_at && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3">Review Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Reviewed by:</span>
                    <span>
                      {order.reviewer ? 
                        `${order.reviewer.first_name} ${order.reviewer.last_name}` : 
                        'Unknown Reviewer'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Reviewed on:</span>
                    <span>{format(new Date(order.reviewed_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Attachments */}
          {order.attachments && order.attachments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Attachments</h3>
              <div className="grid grid-cols-2 gap-4">
                {order.attachments.map((url, index) => (
                  <div key={index} className="space-y-2">
                    <img
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                      onClick={() => window.open(url, '_blank')}
                      style={{ cursor: 'pointer' }}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Click to view full size
                    </p>
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

export default ChangeOrderDetails;
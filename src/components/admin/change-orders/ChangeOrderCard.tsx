import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Check, X, CheckCircle, MapPin, Calendar, User } from 'lucide-react';
import { ChangeOrder } from '@/hooks/useChangeOrders';
import EmployeeAvatar from '@/components/ui/employee-avatar';

interface ChangeOrderCardProps {
  order: ChangeOrder;
  jobsiteName: string;
  onViewDetails: (order: ChangeOrder) => void;
  onEdit: (order: ChangeOrder) => void;
  onDelete: (order: ChangeOrder) => void;
  onApprove: (order: ChangeOrder) => void;
  onReject: (order: ChangeOrder) => void;
  onComplete: (order: ChangeOrder) => void;
  canEdit: (order: ChangeOrder) => boolean;
  canDelete: (order: ChangeOrder) => boolean;
  canApprove: (order: ChangeOrder) => boolean;
  isAdmin: boolean;
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

const ChangeOrderCard: React.FC<ChangeOrderCardProps> = ({
  order,
  jobsiteName,
  onViewDetails,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onComplete,
  canEdit,
  canDelete,
  canApprove,
  isAdmin,
}) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary min-w-0">
      <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 md:mb-2 flex-wrap">
              <h3 className="font-semibold text-base md:text-lg text-foreground line-clamp-1">
                {order.title}
              </h3>
              <Badge variant="outline" className="text-xs shrink-0">
                {order.type === 'admin' ? 'Official' : 'Request'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[120px] md:max-w-none">{jobsiteName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Badge className={`${statusColors[order.status] || statusColors.draft} shrink-0 text-xs`}>
            {statusLabels[order.status] || order.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-3 md:px-6 pb-3 md:pb-6">
        <div className="space-y-3 md:space-y-4">
          {/* Description */}
          {order.description && (
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
              {order.description}
            </p>
          )}

          {/* Cost and Creator Info */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
              <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <EmployeeAvatar
                photoUrl={order.creator?.photo_url}
                firstName={order.creator?.first_name}
                lastName={order.creator?.last_name}
                size="sm"
              />
              <span className="text-xs md:text-sm text-foreground truncate">
                {order.creator ? `${order.creator.first_name} ${order.creator.last_name}` : 'Unknown'}
              </span>
            </div>
            <div className="text-right shrink-0">
              <p className="text-base md:text-lg font-semibold text-foreground">
                {formatCurrency(order.cost)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(order)}
              className="gap-2 w-full h-9"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>

            <div className="flex items-center gap-1 md:gap-1.5 flex-wrap justify-center">
              {canEdit(order) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(order)}
                  title="Edit change order"
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}

              {canApprove(order) && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onApprove(order)}
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Approve change order"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onReject(order)}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Reject change order"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}

              {isAdmin && order.status === 'approved' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onComplete(order)}
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Mark as completed"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}

              {canDelete(order) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(order)}
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete change order"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChangeOrderCard;
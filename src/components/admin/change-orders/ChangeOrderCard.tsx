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
  canViewCost?: boolean;
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
  canViewCost = true,
}) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                {order.title}
              </h3>
              <Badge variant="outline" className="text-xs">
                {order.type === 'admin' ? 'Official' : 'Request'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{jobsiteName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Badge className={statusColors[order.status] || statusColors.draft}>
            {statusLabels[order.status] || order.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Description */}
          {order.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {order.description}
            </p>
          )}

          {/* Cost and Creator Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <EmployeeAvatar
                photoUrl={order.creator?.photo_url}
                firstName={order.creator?.first_name}
                lastName={order.creator?.last_name}
                size="sm"
              />
              <span className="text-sm text-foreground">
                {order.creator ? `${order.creator.first_name} ${order.creator.last_name}` : 'Unknown'}
              </span>
            </div>
            {canViewCost && (
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(order.cost)}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(order)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>

            <div className="flex items-center gap-1">
              {canEdit(order) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(order)}
                  title="Edit change order"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}

              {canApprove(order) && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onApprove(order)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Approve change order"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReject(order)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Reject change order"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}

              {isAdmin && order.status === 'approved' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onComplete(order)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Mark as completed"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}

              {canDelete(order) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(order)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
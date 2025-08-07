import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Package2, Eye, Download, Image } from 'lucide-react';
import { format } from 'date-fns';
import { MaterialRequest, RequestStatus } from '../types/materialRequest';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMaterialRequestAttachments } from '@/hooks/useMaterialRequestAttachments';

interface EnhancedMaterialRequestCardProps {
  request: MaterialRequest;
  onStatusUpdate: (id: string, status: RequestStatus) => void;
  onViewDetails: (request: MaterialRequest) => void;
  onExportPDF: (request: MaterialRequest) => void;
}

const EnhancedMaterialRequestCard = ({
  request,
  onStatusUpdate,
  onViewDetails,
  onExportPDF
}: EnhancedMaterialRequestCardProps) => {
  const { data: attachments = [] } = useMaterialRequestAttachments(request.id);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'ordered': return 'bg-info text-info-foreground';
      case 'delivered': return 'bg-success text-success-foreground';
      case 'archived': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatUserDisplay = (userId: string | null, userName?: string) => {
    if (!userId) return 'Former Employee';
    if (userName && userName.trim()) return userName;
    return `User ${userId.substring(0, 8)}...`;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const isOverdue = () => {
    const deliveryDate = new Date(request.delivery_date);
    const today = new Date();
    return deliveryDate < today && request.status === 'pending';
  };

  const isSameDay = () => {
    const deliveryDate = new Date(request.delivery_date);
    const today = new Date();
    return deliveryDate.toDateString() === today.toDateString();
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isOverdue() ? 'border-destructive/50' : ''}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {request.jobsites?.name || 'Unknown Jobsite'}
                </h3>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
                {isOverdue() && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
                {isSameDay() && (
                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                    Same Day
                  </Badge>
                )}
              </div>
              
              {request.jobsites?.address && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-3 w-3" />
                  <span>{request.jobsites.address}</span>
                </div>
              )}
            </div>
            
            {attachments.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Image className="h-4 w-4" />
                <span className="text-sm">{attachments.length}</span>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(new Date(request.delivery_date), 'MMM dd, yyyy')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{request.delivery_time}</span>
              </div>
              
              {request.floor_unit && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Floor/Unit: {request.floor_unit}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{formatUserDisplay(request.submitted_by, (request as any).submitted_by_name)}</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Submitted {format(new Date(request.created_at), 'MMM dd \'at\' h:mm a')}
              </div>
            </div>
          </div>

          {/* Material List Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Materials</span>
            </div>
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm text-muted-foreground">
                {truncateText(request.material_list)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(request)}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                Details
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportPDF(request)}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
            
            <Select
              value={request.status}
              onValueChange={(value: RequestStatus) => onStatusUpdate(request.id, value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedMaterialRequestCard;
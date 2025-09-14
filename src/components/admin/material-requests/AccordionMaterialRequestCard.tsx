import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Package2, 
  Eye, 
  Download, 
  Image,
  ChevronDown,
  Building2,
  Trash2,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { MaterialRequest, RequestStatus } from '../types/materialRequest';
import { useMaterialRequestAttachments } from '@/hooks/useMaterialRequestAttachments';
import { useMaterialRequestLineItems } from '@/hooks/useMaterialRequestLineItems';
import { formatLineItemsForDisplay } from '@/utils/materialRequestFormatting';
import AdminEditMaterialRequestDialog from './AdminEditMaterialRequestDialog';

interface AccordionMaterialRequestCardProps {
  request: MaterialRequest;
  isExpanded: boolean;
  onToggle: (isExpanded: boolean) => void;
  onStatusUpdate: (id: string, status: RequestStatus) => void;
  onViewDetails: (request: MaterialRequest) => void;
  onExportPDF: (request: MaterialRequest) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

const AccordionMaterialRequestCard = ({
  request,
  isExpanded,
  onToggle,
  onStatusUpdate,
  onViewDetails,
  onExportPDF,
  onDelete,
  isAdmin
}: AccordionMaterialRequestCardProps) => {
  const { data: attachments = [] } = useMaterialRequestAttachments(request.id);
  const { data: lineItems = [] } = useMaterialRequestLineItems(request.id);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ordered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return '🟡';
      case 'ordered': return '🔵';
      case 'delivered': return '🟢';
      case 'archived': return '⚫';
      default: return '⚫';
    }
  };

  const formatUserDisplay = (userId: string | null, userName?: string) => {
    if (!userId) return 'Former Employee';
    if (userName && userName.trim()) return userName;
    return `User ${userId.substring(0, 8)}...`;
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
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className={`transition-all duration-200 hover:shadow-md border ${
        isOverdue() ? 'border-red-200 bg-red-50/30' : 
        isSameDay() ? 'border-yellow-200 bg-yellow-50/30' : 
        'border-border hover:border-primary/20'
      } ${isExpanded ? 'shadow-lg' : 'shadow-sm'}`}>
        
        {/* Collapsed Header - Always Visible */}
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <h3 className="font-semibold text-foreground truncate">
                    {request.jobsites?.name || 'Unknown Jobsite'}
                  </h3>
                  <Badge className={`${getStatusColor(request.status)} text-xs font-medium px-2 py-0.5`}>
                    {getStatusIcon(request.status)} {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <User className="h-3 w-3" />
                    <span className="font-medium text-foreground">
                      {formatUserDisplay(request.submitted_by, (request as any).submitted_by_name)}
                    </span>
                  </div>
                  {request.jobsites?.address && (
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{request.jobsites.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(request.delivery_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    <span>{request.delivery_time}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {attachments.length > 0 && (
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                    <Image className="h-3 w-3" />
                    <span>{attachments.length}</span>
                  </div>
                )}
                
                {isOverdue() && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
                
                {isSameDay() && !isOverdue() && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                    Today
                  </Badge>
                )}
                
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="px-4 pb-4 space-y-4 border-t border-border/50">
            
            {/* Delivery Information */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Delivery Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium text-sm">
                      {format(new Date(request.delivery_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-1.5 rounded">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-medium text-sm">{request.delivery_time}</p>
                  </div>
                </div>
                
                {request.floor_unit && (
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-100 p-1.5 rounded">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Floor/Unit</p>
                      <p className="font-medium text-sm">{request.floor_unit}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submitted By */}
            <div className="flex items-center gap-3 bg-blue-50/50 rounded-lg p-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {formatUserDisplay(request.submitted_by, (request as any).submitted_by_name)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Submitted {format(new Date(request.created_at), 'MMM dd \'at\' h:mm a')}
                </p>
              </div>
            </div>

            {/* Materials List */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 p-1.5 rounded">
                  <Package2 className="h-4 w-4 text-orange-600" />
                </div>
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Materials Required
                </h4>
              </div>
              <div className="bg-muted/30 border-l-4 border-l-orange-500 rounded-r-lg p-4">
                <div className="max-h-32 overflow-y-auto">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {(request as any).has_line_items && lineItems.length > 0 
                      ? formatLineItemsForDisplay(lineItems)
                      : request.material_list || 'No materials specified'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded">
                    <Image className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Attachments ({attachments.length})
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {attachments.slice(0, 4).map((attachment) => (
                    <div key={attachment.id} className="bg-muted/30 rounded-lg p-2 text-center">
                      <div className="bg-blue-100 p-2 rounded mb-1 mx-auto w-fit">
                        <Image className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {attachment.file_name}
                      </p>
                    </div>
                  ))}
                  {attachments.length > 4 && (
                    <div className="bg-muted/30 rounded-lg p-2 text-center flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">
                        +{attachments.length - 4} more
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(request)}
                  className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExportPDF(request)}
                  className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>

                {isAdmin && (
                  <>
                    <AdminEditMaterialRequestDialog
                      request={request}
                      isAdmin={isAdmin}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 hover:bg-primary/10 hover:border-primary hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Request
                        </Button>
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(request.id)}
                      className="flex items-center gap-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Select
                  value={request.status}
                  onValueChange={(value: RequestStatus) => onStatusUpdate(request.id, value)}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">🟡 Pending</SelectItem>
                    <SelectItem value="ordered">🔵 Ordered</SelectItem>
                    <SelectItem value="delivered">🟢 Delivered</SelectItem>
                    <SelectItem value="archived">⚫ Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default AccordionMaterialRequestCard;
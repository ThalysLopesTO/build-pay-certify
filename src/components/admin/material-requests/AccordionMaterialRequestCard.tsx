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
      case 'pending': return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200 shadow-sm';
      case 'ordered': return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm';
      case 'delivered': return 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 shadow-sm';
      case 'archived': return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200 shadow-sm';
      default: return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200 shadow-sm';
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
      <Card className={`group transition-all duration-300 hover:shadow-xl border-0 ${
        isOverdue() ? 'bg-gradient-to-r from-red-50/80 via-red-50/50 to-red-50/30 shadow-lg shadow-red-100/50 ring-1 ring-red-200' : 
        isSameDay() ? 'bg-gradient-to-r from-yellow-50/80 via-yellow-50/50 to-yellow-50/30 shadow-lg shadow-yellow-100/50 ring-1 ring-yellow-200' : 
        'bg-gradient-to-r from-card via-card to-muted/20 hover:from-primary/5 hover:via-card hover:to-primary/10 shadow-lg shadow-black/5'
      } ${isExpanded ? 'shadow-2xl ring-1 ring-primary/20 scale-[1.02]' : 'hover:scale-[1.01]'} backdrop-blur rounded-xl`}>
        
        {/* Professional Header */}
        <CollapsibleTrigger asChild>
          <div className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-primary/10 p-2.5 rounded-lg group-hover:bg-primary/15 transition-colors">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                      {request.jobsites?.name || 'Unknown Jobsite'}
                    </h3>
                  </div>
                  <Badge className={`${getStatusColor(request.status)} text-sm font-semibold px-3 py-1.5 rounded-lg`}>
                    {getStatusIcon(request.status)} {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                    <div className="bg-blue-100 p-1.5 rounded-md">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Submitted by</p>
                      <p className="font-semibold text-foreground">
                        {formatUserDisplay(request.submitted_by, (request as any).submitted_by_name)}
                      </p>
                    </div>
                  </div>
                  
                  {request.jobsites?.address && (
                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                      <div className="bg-green-100 p-1.5 rounded-md">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground font-medium">Address</p>
                        <p className="font-semibold text-foreground truncate">{request.jobsites.address}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                    <div className="bg-purple-100 p-1.5 rounded-md">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Delivery Date</p>
                      <p className="font-semibold text-foreground">{format(new Date(request.delivery_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                    <div className="bg-orange-100 p-1.5 rounded-md">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Time</p>
                      <p className="font-semibold text-foreground">{request.delivery_time}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 ml-6">
                {attachments.length > 0 && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold shadow-sm">
                    <Image className="h-4 w-4" />
                    <span>{attachments.length} {attachments.length === 1 ? 'file' : 'files'}</span>
                  </div>
                )}
                
                {isOverdue() && (
                  <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 text-sm font-semibold shadow-md">
                    🚨 Overdue
                  </Badge>
                )}
                
                {isSameDay() && !isOverdue() && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1.5 text-sm font-semibold shadow-md">
                    ⚡ Today
                  </Badge>
                )}
                
                <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/15 transition-colors">
                  <ChevronDown className={`h-5 w-5 text-primary transition-transform duration-300 ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Enhanced Expanded Content */}
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="px-6 pb-6 space-y-6 border-t border-gradient-to-r from-border/50 via-primary/20 to-border/50 bg-gradient-to-br from-muted/30 to-background/50">
            
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

            {/* Professional Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gradient-to-r from-border/50 via-primary/20 to-border/50">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(request)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 text-blue-700 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExportPDF(request)}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200 text-green-700 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
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
                          className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border-primary/20 text-primary font-semibold shadow-sm hover:shadow-md transition-all duration-200"
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
                      className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-200 text-red-700 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground">Update Status:</span>
                <Select
                  value={request.status}
                  onValueChange={(value: RequestStatus) => onStatusUpdate(request.id, value)}
                >
                  <SelectTrigger className="w-40 h-10 text-sm font-semibold bg-gradient-to-r from-muted/50 to-background border-2 hover:border-primary/30 focus:border-primary shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur border-2">
                    <SelectItem value="pending" className="font-semibold">🟡 Pending</SelectItem>
                    <SelectItem value="ordered" className="font-semibold">🔵 Ordered</SelectItem>
                    <SelectItem value="delivered" className="font-semibold">🟢 Delivered</SelectItem>
                    <SelectItem value="archived" className="font-semibold">⚫ Archived</SelectItem>
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
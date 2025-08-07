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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ordered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'delivered': return '✅';
      case 'ordered': return '📦';
      case 'pending': return '⏳';
      case 'archived': return '📁';
      default: return '';
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
    <Card className={`transition-all duration-200 hover:shadow-lg border-l-4 ${
      isOverdue() ? 'border-l-red-500 bg-red-50/50' : 
      isSameDay() ? 'border-l-yellow-500 bg-yellow-50/50' : 
      'border-l-gray-200'
    }`}>
      <CardContent className="p-6">
        <div className="space-y-5">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-foreground leading-tight">
                  {request.jobsites?.name || 'Unknown Jobsite'}
                </h3>
                <Badge className={`${getStatusColor(request.status)} font-medium px-3 py-1`}>
                  {getStatusIcon(request.status)} {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>
              
              {request.jobsites?.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{request.jobsites.address}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {attachments.length > 0 && (
                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                  <Image className="h-3 w-3" />
                  <span>{attachments.length} photo{attachments.length > 1 ? 's' : ''}</span>
                </div>
              )}
              
              {isOverdue() && (
                <Badge variant="destructive" className="text-xs font-semibold">
                  ⚠️ Overdue
                </Badge>
              )}
              
              {isSameDay() && !isOverdue() && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs font-semibold">
                  ⚠️ Same-Day Delivery
                </Badge>
              )}
            </div>
          </div>

          {/* Delivery Information Section */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Delivery Info</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-1 rounded">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold text-sm">
                    {format(new Date(request.delivery_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-1 rounded">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-semibold text-sm">{request.delivery_time}</p>
                </div>
              </div>
              
              {request.floor_unit && (
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 p-1 rounded">
                    <MapPin className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Floor/Unit</p>
                    <p className="font-semibold text-sm">{request.floor_unit}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submitted By Section */}
          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  {formatUserDisplay(request.submitted_by, (request as any).submitted_by_name)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Submitted {format(new Date(request.created_at), 'MMM dd \'at\' h:mm a')}
                </p>
              </div>
            </div>
          </div>

          {/* Material List Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-orange-100 p-1 rounded">
                <Package2 className="h-4 w-4 text-orange-600" />
              </div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Materials</h4>
            </div>
            <div className="bg-gray-50 border-l-4 border-l-orange-500 rounded-r-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {truncateText(request.material_list, 150)}
              </p>
              {request.material_list.length > 150 && (
                <p className="text-xs text-blue-600 mt-2 cursor-pointer hover:underline" 
                   onClick={() => onViewDetails(request)}>
                  View full list...
                </p>
              )}
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(request)}
                className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportPDF(request)}
                className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Select
                value={request.status}
                onValueChange={(value: RequestStatus) => onStatusUpdate(request.id, value)}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">⏳ Pending</SelectItem>
                  <SelectItem value="ordered">📦 Ordered</SelectItem>
                  <SelectItem value="delivered">✅ Delivered</SelectItem>
                  <SelectItem value="archived">📁 Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedMaterialRequestCard;

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Package, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { MaterialRequest, RequestStatus } from './types/materialRequest';
import MaterialRequestDetailsDialog from './MaterialRequestDetailsDialog';

interface MaterialRequestItemProps {
  request: MaterialRequest;
  selectedRequest: MaterialRequest | null;
  setSelectedRequest: (request: MaterialRequest | null) => void;
  onStatusUpdate: (id: string, status: RequestStatus) => void;
}

const MaterialRequestItem = ({
  request,
  selectedRequest,
  setSelectedRequest,
  onStatusUpdate
}: MaterialRequestItemProps) => {
  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-semibold text-lg">{request.jobsites?.name || 'Unknown Jobsite'}</h3>
            <Badge className={getStatusColor(request.status)}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(request.delivery_date), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Package className="h-4 w-4" />
              <span>{request.delivery_time}</span>
            </div>
            {request.floor_unit && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{request.floor_unit}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>Submitted {format(new Date(request.created_at), 'MMM dd')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <MaterialRequestDetailsDialog
            request={request}
            selectedRequest={selectedRequest}
            setSelectedRequest={setSelectedRequest}
            onStatusUpdate={onStatusUpdate}
          />

          <Select
            value={request.status}
            onValueChange={(value: RequestStatus) =>
              onStatusUpdate(request.id, value)
            }
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
    </div>
  );
};

export default MaterialRequestItem;

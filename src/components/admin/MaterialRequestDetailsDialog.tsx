
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, MapPin, Package, User } from 'lucide-react';
import { format } from 'date-fns';
import { MaterialRequest, RequestStatus } from './types/materialRequest';

interface MaterialRequestDetailsDialogProps {
  request: MaterialRequest;
  selectedRequest: MaterialRequest | null;
  setSelectedRequest: (request: MaterialRequest | null) => void;
  onStatusUpdate: (id: string, status: RequestStatus) => void;
}

const MaterialRequestDetailsDialog = ({
  request,
  selectedRequest,
  setSelectedRequest,
  onStatusUpdate
}: MaterialRequestDetailsDialogProps) => {
  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUserDisplay = (userId: string) => {
    return `User ID: ${userId.substring(0, 8)}...`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedRequest(request)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Material Request Details</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and ID */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Request ID</p>
              <p className="font-mono text-sm">{request.id}</p>
            </div>
            <Badge className={getStatusColor(request.status)}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>

          {/* Jobsite Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">Jobsite</span>
              </div>
              <div>
                <p className="font-medium">{request.jobsites?.name || 'Unknown Jobsite'}</p>
                {request.jobsites?.address && (
                  <p className="text-sm text-gray-600">{request.jobsites.address}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">Delivery</span>
              </div>
              <div>
                <p className="font-medium">{format(new Date(request.delivery_date), 'MMMM dd, yyyy')}</p>
                <p className="text-sm text-gray-600">{request.delivery_time}</p>
              </div>
            </div>
          </div>

          {/* Floor/Unit */}
          {request.floor_unit && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">Floor/Unit</span>
              </div>
              <p>{request.floor_unit}</p>
            </div>
          )}

          {/* Submitted By */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-semibold">Submitted By</span>
            </div>
            <p className="text-sm text-gray-600 font-mono" title={request.submitted_by}>
              {formatUserDisplay(request.submitted_by)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Submitted on {format(new Date(request.created_at), 'MMM dd, yyyy \'at\' h:mm a')}
            </p>
          </div>
          
          {/* Material List */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="font-semibold">Material List</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-md border">
              <pre className="whitespace-pre-wrap text-sm">{request.material_list}</pre>
            </div>
          </div>
          
          {/* Status Update */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Update Status:</span>
              <Select
                value={request.status}
                onValueChange={(value: RequestStatus) => {
                  onStatusUpdate(request.id, value);
                  setSelectedRequest({ ...request, status: value });
                }}
              >
                <SelectTrigger className="w-48">
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
      </DialogContent>
    </Dialog>
  );
};

export default MaterialRequestDetailsDialog;


import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye } from 'lucide-react';
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
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedRequest(request)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Material Request Details</DialogTitle>
        </DialogHeader>
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold">Jobsite:</label>
                <p>{selectedRequest.jobsites?.name || 'Unknown Jobsite'}</p>
                <p className="text-sm text-gray-600">{selectedRequest.jobsites?.address}</p>
              </div>
              <div>
                <label className="font-semibold">Delivery:</label>
                <p>{format(new Date(selectedRequest.delivery_date), 'MMMM dd, yyyy')}</p>
                <p className="text-sm text-gray-600">{selectedRequest.delivery_time}</p>
              </div>
            </div>
            
            {selectedRequest.floor_unit && (
              <div>
                <label className="font-semibold">Floor/Unit:</label>
                <p>{selectedRequest.floor_unit}</p>
              </div>
            )}

            <div>
              <label className="font-semibold">Submitted by:</label>
              <p className="text-sm text-gray-600">User ID: {selectedRequest.submitted_by}</p>
            </div>
            
            <div>
              <label className="font-semibold">Material List:</label>
              <div className="mt-2 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                {selectedRequest.material_list}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="font-semibold">Update Status:</label>
              <Select
                value={selectedRequest.status}
                onValueChange={(value: RequestStatus) => {
                  onStatusUpdate(selectedRequest.id, value);
                  setSelectedRequest({ ...selectedRequest, status: value });
                }}
              >
                <SelectTrigger className="w-40">
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MaterialRequestDetailsDialog;

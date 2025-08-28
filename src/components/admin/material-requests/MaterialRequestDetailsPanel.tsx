import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Package2, User, Download, X, Image, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { MaterialRequest, RequestStatus } from '../types/materialRequest';
import { useMaterialRequestAttachments } from '@/hooks/useMaterialRequestAttachments';
import MaterialRequestPhotosViewer from '@/components/foreman/MaterialRequestPhotosViewer';
import { supabase } from '@/integrations/supabase/client';
import AdminEditMaterialRequestDialog from './AdminEditMaterialRequestDialog';

interface MaterialRequestDetailsPanelProps {
  request: MaterialRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (id: string, status: RequestStatus) => void;
  onExportPDF: (request: MaterialRequest) => void;
  isAdmin?: boolean;
}

const MaterialRequestDetailsPanel = ({
  request,
  isOpen,
  onClose,
  onStatusUpdate,
  onExportPDF,
  isAdmin = false
}: MaterialRequestDetailsPanelProps) => {
  const { data: attachments = [] } = useMaterialRequestAttachments(request?.id);

  if (!request) return null;

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

  const downloadAttachment = async (attachment: any) => {
    try {
      const { data } = await supabase.storage
        .from('material-request-attachments')
        .download(attachment.file_path);
      
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Material Request Details
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Header Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">
                {request.jobsites?.name || 'Unknown Jobsite'}
              </h2>
              <Badge className={getStatusColor(request.status)}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground font-mono">
              ID: {request.id}
            </div>
          </div>

          {/* Jobsite Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Jobsite Information
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div>
                <span className="font-medium">Name:</span> {request.jobsites?.name || 'Unknown'}
              </div>
              {request.jobsites?.address && (
                <div>
                  <span className="font-medium">Address:</span> {request.jobsites.address}
                </div>
              )}
              {request.floor_unit && (
                <div>
                  <span className="font-medium">Floor/Unit:</span> {request.floor_unit}
                </div>
              )}
            </div>
          </div>

          {/* Delivery Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Delivery Information
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div>
                <span className="font-medium">Date:</span> {format(new Date(request.delivery_date), 'MMMM dd, yyyy')}
              </div>
              <div>
                <span className="font-medium">Time:</span> {request.delivery_time}
              </div>
            </div>
          </div>

          {/* Submitter Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Submitted By
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div>
                <span className="font-medium">Name:</span> {formatUserDisplay(request.submitted_by, (request as any).submitted_by_name)}
              </div>
              <div>
                <span className="font-medium">Submitted:</span> {format(new Date(request.created_at), 'MMM dd, yyyy \'at\' h:mm a')}
              </div>
            </div>
          </div>

          {/* Material List */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package2 className="h-4 w-4" />
              Material List
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono">{request.material_list}</pre>
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Image className="h-4 w-4" />
                Attachments ({attachments.length})
              </h3>
              <div className="space-y-2">
                <MaterialRequestPhotosViewer materialRequestId={request.id} />
                <div className="text-xs text-muted-foreground">
                  Click the button above to view all attachments in a gallery
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Update Status</span>
              <Select
                value={request.status}
                onValueChange={(value: RequestStatus) => onStatusUpdate(request.id, value)}
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

            <div className="flex gap-2">
              {isAdmin && (
                <AdminEditMaterialRequestDialog
                  request={request}
                  isAdmin={isAdmin}
                  trigger={
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Request
                    </Button>
                  }
                />
              )}
              <Button
                onClick={() => onExportPDF(request)}
                className="flex-1 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MaterialRequestDetailsPanel;
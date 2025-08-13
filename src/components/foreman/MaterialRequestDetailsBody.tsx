import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Package2, User, Image } from 'lucide-react';
import { format } from 'date-fns';
import MaterialRequestPhotosViewer from '@/components/foreman/MaterialRequestPhotosViewer';
import { EnrichedMaterialRequest } from '@/hooks/useMaterialRequests';
import { useMaterialRequestAttachments } from '@/hooks/useMaterialRequestAttachments';

interface Props {
  request: EnrichedMaterialRequest;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-warning text-warning-foreground';
    case 'ordered': return 'bg-info text-info-foreground';
    case 'delivered': return 'bg-success text-success-foreground';
    case 'archived': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const MaterialRequestDetailsBody: React.FC<Props> = ({ request }) => {
  const { data: attachments = [] } = useMaterialRequestAttachments(request.id);

  return (
    <div className="space-y-6">
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
        <div className="text-sm text-muted-foreground font-mono">ID: {request.id}</div>
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

      {/* Delivery and Created Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Delivery
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
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Created by
          </h3>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div>
              <span className="font-medium">User:</span> {request.submitted_by || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Created:</span> {format(new Date(request.created_at), "MMM dd, yyyy 'at' h:mm a")}
            </div>
          </div>
        </div>
      </div>

      {/* Materials */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Package2 className="h-4 w-4" />
          Materials
        </h3>
        <div className="bg-muted/50 rounded-lg p-4">
          <pre className="whitespace-pre-wrap text-sm font-mono">{request.material_list || 'No materials provided.'}</pre>
        </div>
      </div>

      {/* Attachments */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Image className="h-4 w-4" />
          Photos & Files {attachments.length > 0 ? `(${attachments.length})` : ''}
        </h3>
        {attachments.length > 0 ? (
          <MaterialRequestPhotosViewer materialRequestId={request.id} />
        ) : (
          <div className="text-sm text-muted-foreground">No attachments yet.</div>
        )}
      </div>

      {/* Activity (basic) */}
      <div className="space-y-3">
        <h3 className="font-semibold">Activity</h3>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div>Created • {format(new Date(request.created_at), "MMM dd, yyyy 'at' h:mm a")}</div>
          {request.updated_at && request.updated_at !== request.created_at && (
            <div>Last updated • {format(new Date(request.updated_at), "MMM dd, yyyy 'at' h:mm a")} ({request.status})</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialRequestDetailsBody;

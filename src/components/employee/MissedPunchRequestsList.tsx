import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useMyMissedPunchRequests } from '@/hooks/useMissedPunchRequests';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
};

const statusIcons = {
  pending: AlertCircle,
  approved: Clock,
  declined: AlertCircle,
};

const formatTimeDisplay = (timeString: string) => {
  if (!timeString) return 'N/A';
  
  // Extract time part from the ISO string (HH:MM:SS)
  const timePart = timeString.split('T')[1]?.substring(0, 5);
  if (!timePart) return 'N/A';
  
  // Convert to 12-hour format
  const [hours, minutes] = timePart.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

const MissedPunchRequestsList = () => {
  const { data: requests = [], isLoading, error } = useMyMissedPunchRequests();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your requests...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Failed to load your requests. Please try again.
            <div className="text-sm mt-2 text-muted-foreground">
              Error: {error.message}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No requests yet</p>
            <p className="text-sm">Submit your first missed punch request above.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const StatusIcon = statusIcons[request.status];
        
        return (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Missed Punch Request
                </CardTitle>
                <Badge className={statusColors[request.status]}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Request Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Date:</strong> {format(new Date(request.request_date), 'PPP')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Type:</strong> {request.punch_type === 'both' ? 'In & Out' : `Punch ${request.punch_type}`}
                  </span>
                </div>

                {request.corrected_time_in && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>In Time:</strong> {formatTimeDisplay(request.corrected_time_in)}
                    </span>
                  </div>
                )}

                {request.corrected_time_out && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Out Time:</strong> {formatTimeDisplay(request.corrected_time_out)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Jobsite:</strong> {request.jobsites?.name || 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Supervisor:</strong> {request.supervisor_on_site}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <strong className="text-sm">Reason:</strong>
                </div>
                <p className="text-sm text-gray-600 pl-6">{request.reason}</p>
              </div>

              {/* Attachment */}
              {request.attachment_url && (
                <div className="space-y-2">
                  <strong className="text-sm">Attachment:</strong>
                  <a 
                    href={request.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block pl-6"
                  >
                    View attachment
                  </a>
                </div>
              )}

              {/* Decline Reason */}
              {request.status === 'declined' && request.decline_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <strong className="text-sm text-red-700">Decline Reason:</strong>
                  </div>
                  <p className="text-sm text-red-600">{request.decline_reason}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-gray-500 pt-2 border-t">
                Submitted on {format(new Date(request.created_at), 'PPP p')}
                {request.reviewed_at && (
                  <span> • Reviewed on {format(new Date(request.reviewed_at), 'PPP p')}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MissedPunchRequestsList;
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, User, FileText, AlertCircle, Check, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useMissedPunchRequests, useApproveMissedPunchRequest, useDeclineMissedPunchRequest } from '@/hooks/useMissedPunchRequests';
import { useJobsites } from '@/hooks/useJobsites';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
};

const statusIcons = {
  pending: AlertCircle,
  approved: Check,
  declined: X,
};

const formatTimeDisplay = (timeString: string) => {
  if (!timeString) return 'N/A';
  
  // Handle both simple time format (HH:MM) and ISO timestamp format
  let timePart = timeString;
  if (timeString.includes('T')) {
    // Extract time part from ISO string
    timePart = timeString.split('T')[1]?.substring(0, 5);
  }
  
  if (!timePart) return 'N/A';
  
  // Convert to 12-hour format
  const [hours, minutes] = timePart.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatDateDisplay = (dateString: string) => {
  if (!dateString) return 'N/A';
  
  // Parse date string manually to avoid timezone issues
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return format(date, 'PPP');
};

const TimeRequestsManagement = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobsiteFilter, setJobsiteFilter] = useState<string>('all');
  const [declineReason, setDeclineReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  
  const { data: requests = [], isLoading } = useMissedPunchRequests();
  const { data: jobsites = [] } = useJobsites('active');
  const approveMutation = useApproveMissedPunchRequest();
  const declineMutation = useDeclineMissedPunchRequest();

  // Filter requests
  const filteredRequests = requests.filter((request: any) => {
    const statusMatch = statusFilter === 'all' || request.status === statusFilter;
    const jobsiteMatch = jobsiteFilter === 'all' || request.jobsite_id === jobsiteFilter;
    return statusMatch && jobsiteMatch;
  });

  const handleApprove = (requestId: string) => {
    approveMutation.mutate(requestId);
  };

  const handleDecline = () => {
    if (selectedRequestId) {
      declineMutation.mutate({
        requestId: selectedRequestId,
        declineReason: declineReason || undefined,
      });
      setSelectedRequestId(null);
      setDeclineReason('');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading time requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Time Requests Management
        </h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobsite-filter">Jobsite</Label>
              <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All jobsites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobsites</SelectItem>
                  {jobsites.map((jobsite) => (
                    <SelectItem key={jobsite.id} value={jobsite.id}>
                      {jobsite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No requests found</p>
                <p className="text-sm">No time requests match your current filters.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request: any) => {
            const StatusIcon = statusIcons[request.status];
            const employeeName = request.employee_profiles 
              ? `${request.employee_profiles.first_name} ${request.employee_profiles.last_name}`
              : 'Unknown Employee';

            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {employeeName}
                    </CardTitle>
                    <Badge className={statusColors[request.status]}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Employee ID: {request.employee_profiles?.user_id || request.employee_id}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Request Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Date:</strong> {formatDateDisplay(request.request_date)}
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

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={approveMutation.isPending}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {approveMutation.isPending ? 'Approving...' : 'Approve'}
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            onClick={() => setSelectedRequestId(request.id)}
                            disabled={declineMutation.isPending}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Decline Request</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                              Are you sure you want to decline this missed punch request?
                            </p>
                            <div className="space-y-2">
                              <Label htmlFor="decline-reason">Reason for Decline (Optional)</Label>
                              <Textarea
                                id="decline-reason"
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                placeholder="Provide a reason for declining this request..."
                                className="min-h-[100px]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleDecline}
                                disabled={declineMutation.isPending}
                                variant="destructive"
                                className="flex-1"
                              >
                                {declineMutation.isPending ? 'Declining...' : 'Confirm Decline'}
                              </Button>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1">
                                  Cancel
                                </Button>
                              </DialogTrigger>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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
          })
        )}
      </div>
    </div>
  );
};

export default TimeRequestsManagement;
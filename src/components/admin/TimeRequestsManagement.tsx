import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, User, FileText, AlertCircle, Check, X, Filter, Archive, Clock3, History } from 'lucide-react';
import { format } from 'date-fns';
import { useMissedPunchRequests, useApproveMissedPunchRequest, useDeclineMissedPunchRequest } from '@/hooks/useMissedPunchRequests';
import { useJobsites } from '@/hooks/useJobsites';

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm',
  declined: 'bg-red-50 text-red-700 border-red-200 shadow-sm',
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

const formatDateTimeDisplay = (dateTimeString: string) => {
  if (!dateTimeString) return 'N/A';
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, 'PPP p');
  } catch (error) {
    return 'Invalid Date';
  }
};

// Request Card Component
const RequestCard = ({ request, onApprove, onDecline, isArchived = false }: any) => {
  const StatusIcon = statusIcons[request.status];
  const employeeName = request.employee_profiles 
    ? `${request.employee_profiles.first_name} ${request.employee_profiles.last_name}`
    : 'Unknown Employee';

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 border-l-4 ${
      isArchived 
        ? 'border-l-gray-300 bg-gray-50/50' 
        : request.status === 'pending' 
          ? 'border-l-amber-400' 
          : request.status === 'approved' 
            ? 'border-l-emerald-400' 
            : 'border-l-red-400'
    }`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{employeeName}</h3>
            <p className="text-sm text-gray-500 mt-1">
              ID: {request.employee_profiles?.user_id || request.employee_id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isArchived && (
              <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                <Archive className="h-3 w-3 mr-1" />
                Archived
              </Badge>
            )}
            <Badge className={`${statusColors[request.status]} font-medium px-3 py-1 rounded-full`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Request Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDateDisplay(request.request_date)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock3 className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</p>
              <p className="text-sm font-medium text-gray-900">
                {request.punch_type === 'both' ? 'In & Out' : `Punch ${request.punch_type}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <MapPin className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Jobsite</p>
              <p className="text-sm font-medium text-gray-900">{request.jobsites?.name || 'Unknown'}</p>
            </div>
          </div>

          {request.corrected_time_in && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">In Time</p>
                <p className="text-sm font-medium text-blue-900">{formatTimeDisplay(request.corrected_time_in)}</p>
              </div>
            </div>
          )}

          {request.corrected_time_out && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Out Time</p>
                <p className="text-sm font-medium text-blue-900">{formatTimeDisplay(request.corrected_time_out)}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Supervisor</p>
              <p className="text-sm font-medium text-gray-900">{request.supervisor_on_site}</p>
            </div>
          </div>
        </div>

        {/* Reason Section */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Reason</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{request.reason}</p>
        </div>

        {/* Attachment */}
        {request.attachment_url && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <a 
              href={request.attachment_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              View attachment
            </a>
          </div>
        )}

        {/* Decline Reason */}
        {request.status === 'declined' && request.decline_reason && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">Decline Reason</span>
            </div>
            <p className="text-sm text-red-600">{request.decline_reason}</p>
          </div>
        )}

        {/* Actions */}
        {request.status === 'pending' && !isArchived && (
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => onApprove(request.id)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onDecline(request.id)}
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 font-medium"
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 pt-3 border-t border-gray-200 mt-4">
          <div className="flex items-center justify-between">
            <span>Submitted {formatDateTimeDisplay(request.created_at)}</span>
            {request.reviewed_at && (
              <span>Reviewed {formatDateTimeDisplay(request.reviewed_at)}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TimeRequestsManagement = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobsiteFilter, setJobsiteFilter] = useState<string>('all');
  const [declineReason, setDeclineReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  
  const { data: requests = [], isLoading } = useMissedPunchRequests();
  const { data: jobsites = [] } = useJobsites('active');
  const approveMutation = useApproveMissedPunchRequest();
  const declineMutation = useDeclineMissedPunchRequest();

  // Separate active and archived requests
  const activeRequests = requests.filter((request: any) => 
    request.status === 'pending' || request.status === 'declined'
  );
  
  const archivedRequests = requests.filter((request: any) => 
    request.status === 'approved'
  );

  // Filter logic for each tab
  const getFilteredRequests = (requestList: any[]) => {
    return requestList.filter((request: any) => {
      const statusMatch = statusFilter === 'all' || request.status === statusFilter;
      const jobsiteMatch = jobsiteFilter === 'all' || request.jobsite_id === jobsiteFilter;
      return statusMatch && jobsiteMatch;
    });
  };

  const filteredActiveRequests = getFilteredRequests(activeRequests);
  const filteredArchivedRequests = getFilteredRequests(archivedRequests);

  const handleApprove = (requestId: string) => {
    approveMutation.mutate(requestId);
  };

  const handleDecline = (requestId: string) => {
    setSelectedRequestId(requestId);
  };

  const handleDeclineConfirm = () => {
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
        <CardContent className="p-8">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Loading time requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            Time Requests Management
          </h1>
          <p className="text-gray-600 mt-1">Manage and review employee time correction requests</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Filter className="h-5 w-5 text-blue-600" />
            Filter Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm font-semibold text-gray-700">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-300">
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
              <Label htmlFor="jobsite-filter" className="text-sm font-semibold text-gray-700">Jobsite</Label>
              <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
                <SelectTrigger className="border-gray-300">
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 p-1">
          <TabsTrigger 
            value="active" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Clock3 className="h-4 w-4" />
            Active Requests
            <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">
              {filteredActiveRequests.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="archived" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <History className="h-4 w-4" />
            Archived Requests
            <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-700">
              {filteredArchivedRequests.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Active Requests Tab */}
        <TabsContent value="active" className="space-y-4">
          {filteredActiveRequests.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-12">
                <div className="text-center text-gray-500">
                  <Clock3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No active requests</h3>
                  <p className="text-sm">No time requests match your current filters.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredActiveRequests.map((request: any) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onDecline={handleDecline}
                  isArchived={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Archived Requests Tab */}
        <TabsContent value="archived" className="space-y-4">
          {filteredArchivedRequests.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-12">
                <div className="text-center text-gray-500">
                  <Archive className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No archived requests</h3>
                  <p className="text-sm">Approved requests will appear here once archived.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredArchivedRequests.map((request: any) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onApprove={() => {}}
                  onDecline={() => {}}
                  isArchived={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Decline Dialog */}
      <Dialog open={!!selectedRequestId} onOpenChange={() => setSelectedRequestId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              Decline Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to decline this missed punch request?
            </p>
            <div className="space-y-2">
              <Label htmlFor="decline-reason" className="text-sm font-semibold">
                Reason for Decline (Optional)
              </Label>
              <Textarea
                id="decline-reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Provide a reason for declining this request..."
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDeclineConfirm}
                disabled={declineMutation.isPending}
                variant="destructive"
                className="flex-1"
              >
                {declineMutation.isPending ? 'Declining...' : 'Confirm Decline'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setSelectedRequestId(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeRequestsManagement;
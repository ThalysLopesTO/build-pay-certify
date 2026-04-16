import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  AlertCircle,
  Check,
  X,
  Edit,
  Trash2,
  ArrowRight,
  Activity,
  Building2,
  CalendarRange,
  Inbox,
  CheckCircle2,
  XCircle,
  ArrowDownToLine,
  Paperclip,
  Sparkles,
} from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import {
  useMissedPunchRequests,
  useApproveMissedPunchRequest,
  useDeclineMissedPunchRequest,
  useEditMissedPunchRequest,
  useDeleteMissedPunchRequest,
} from '@/hooks/useMissedPunchRequests';
import { useJobsites } from '@/hooks/useJobsites';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const formatTimeDisplay = (timeString?: string) => {
  if (!timeString) return 'N/A';
  let timePart = timeString;
  if (timeString.includes('T')) timePart = timeString.split('T')[1]?.substring(0, 5);
  if (!timePart) return 'N/A';
  const [hours, minutes] = timePart.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatDateDisplay = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return format(date, 'PPP');
};

const formatShortDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return format(date, 'MMM d, yyyy');
};

const formatRelativeDateTime = (dateTimeString?: string) => {
  if (!dateTimeString) return 'N/A';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, "MMM d, yyyy 'at' p");
  } catch {
    return 'Invalid Date';
  }
};

const getInitials = (firstName?: string, lastName?: string) => {
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
};

const punchTypeLabel = (type: string) => {
  if (type === 'both') return 'Punch In & Out';
  if (type === 'in') return 'Punch In';
  if (type === 'out') return 'Punch Out';
  return type;
};

type DateRangeFilter = 'all' | 'today' | 'week' | 'month';

/* -------------------------------------------------------------------------- */
/*  Edit Dialog                                                               */
/* -------------------------------------------------------------------------- */

const EditRequestDialog = ({ request, jobsites, onSave, onClose, isLoading }: any) => {
  const [formData, setFormData] = useState({
    request_date: '',
    punch_type: 'in' as 'in' | 'out' | 'both',
    corrected_time_in: '',
    corrected_time_out: '',
    jobsite_id: '',
    reason: '',
  });

  React.useEffect(() => {
    if (request) {
      setFormData({
        request_date: request.request_date || '',
        punch_type: request.punch_type || 'in',
        corrected_time_in: request.corrected_time_in || '',
        corrected_time_out: request.corrected_time_out || '',
        jobsite_id: request.jobsite_id || '',
        reason: request.reason || '',
      });
    }
  }, [request]);

  if (!request) return null;

  const showIn = formData.punch_type === 'in' || formData.punch_type === 'both';
  const showOut = formData.punch_type === 'out' || formData.punch_type === 'both';

  return (
    <Dialog open={!!request} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Edit className="h-4 w-4 text-primary" />
            Edit Time Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-lg border bg-muted/40 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Employee</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {request.employee_profiles?.first_name} {request.employee_profiles?.last_name}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-date" className="text-xs font-medium">Request Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.request_date}
                onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-punch-type" className="text-xs font-medium">Punch Type</Label>
              <Select
                value={formData.punch_type}
                onValueChange={(value: 'in' | 'out' | 'both') => setFormData({ ...formData, punch_type: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Punch In</SelectItem>
                  <SelectItem value="out">Punch Out</SelectItem>
                  <SelectItem value="both">Both In & Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(showIn || showOut) && (
            <div className={cn('grid gap-4', showIn && showOut ? 'grid-cols-2' : 'grid-cols-1')}>
              {showIn && (
                <div className="space-y-1.5">
                  <Label htmlFor="edit-time-in" className="text-xs font-medium">Corrected In Time</Label>
                  <Input
                    id="edit-time-in"
                    type="time"
                    value={formData.corrected_time_in}
                    onChange={(e) => setFormData({ ...formData, corrected_time_in: e.target.value })}
                  />
                </div>
              )}
              {showOut && (
                <div className="space-y-1.5">
                  <Label htmlFor="edit-time-out" className="text-xs font-medium">Corrected Out Time</Label>
                  <Input
                    id="edit-time-out"
                    type="time"
                    value={formData.corrected_time_out}
                    onChange={(e) => setFormData({ ...formData, corrected_time_out: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-jobsite" className="text-xs font-medium">Jobsite</Label>
            <Select value={formData.jobsite_id} onValueChange={(value) => setFormData({ ...formData, jobsite_id: value })}>
              <SelectTrigger><SelectValue placeholder="Select jobsite" /></SelectTrigger>
              <SelectContent>
                {jobsites.map((jobsite: any) => (
                  <SelectItem key={jobsite.id} value={jobsite.id}>{jobsite.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-reason" className="text-xs font-medium">Reason</Label>
            <Textarea
              id="edit-reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Reason for the time correction..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="sm:flex-1">Cancel</Button>
            <Button onClick={() => onSave(formData)} disabled={isLoading} className="sm:flex-1">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------------------------- */
/*  Status badge mapping → BadgeWithDot color                                 */
/* -------------------------------------------------------------------------- */

const statusBadgeColor: Record<string, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  declined: 'error',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
};

/* -------------------------------------------------------------------------- */
/*  Request Card                                                              */
/* -------------------------------------------------------------------------- */

const RequestCard = ({ request, onApprove, onDecline, onEdit, onDelete, isArchived = false, userRole }: any) => {
  const employeeFirst = request.employee_profiles?.first_name;
  const employeeLast = request.employee_profiles?.last_name;
  const employeeName = employeeFirst || employeeLast
    ? `${employeeFirst ?? ''} ${employeeLast ?? ''}`.trim()
    : 'Unknown Employee';

  const canEditDelete = userRole && ['admin', 'super_admin', 'management'].includes(userRole);
  const showCorrectedTimes = !!(request.corrected_time_in || request.corrected_time_out);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5 space-y-4">
        {/* Row 1 — Employee strip */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {getInitials(employeeFirst, employeeLast)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{employeeName}</p>
              <p className="text-xs text-muted-foreground truncate">
                Submitted {formatRelativeDateTime(request.created_at)}
              </p>
            </div>
          </div>

          <BadgeWithDot
            color={statusBadgeColor[request.status] ?? 'gray'}
            size="md"
            pulse={request.status === 'pending'}
          >
            {statusLabel[request.status] ?? request.status}
          </BadgeWithDot>
        </div>

        {/* Row 2 — Compact inline info strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{formatShortDate(request.request_date)}</span>
          </div>
          <div className="h-3 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{punchTypeLabel(request.punch_type)}</span>
          </div>
          <div className="h-3 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium text-foreground truncate">{request.jobsites?.name || 'Unknown jobsite'}</span>
          </div>
          {request.supervisor_on_site && (
            <>
              <div className="h-3 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-medium text-foreground truncate">{request.supervisor_on_site}</span>
              </div>
            </>
          )}
        </div>

        {/* Row 3 — Corrected time chips */}
        {showCorrectedTimes && (
          <div className="flex flex-wrap gap-2">
            {request.corrected_time_in && (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs dark:border-emerald-800 dark:bg-emerald-950">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Clock In</span>
                <ArrowRight className="h-3 w-3 text-emerald-500" />
                <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                  {formatTimeDisplay(request.corrected_time_in)}
                </span>
              </div>
            )}
            {request.corrected_time_out && (
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs dark:border-blue-800 dark:bg-blue-950">
                <span className="text-blue-700 dark:text-blue-400 font-medium">Clock Out</span>
                <ArrowRight className="h-3 w-3 text-blue-500" />
                <span className="font-semibold text-blue-900 dark:text-blue-300">
                  {formatTimeDisplay(request.corrected_time_out)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Row 4 — Reason */}
        {request.reason && (
          <div className="rounded-lg border bg-card px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{request.reason}</p>
          </div>
        )}

        {/* Attachment */}
        {request.attachment_url && (
          <a
            href={request.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Paperclip className="h-3.5 w-3.5" />
            View attachment
          </a>
        )}

        {/* Row 5 — Decline reason */}
        {request.status === 'declined' && request.decline_reason && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800 dark:bg-red-950">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                Decline Reason
              </span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{request.decline_reason}</p>
          </div>
        )}

        {/* Reviewed timestamp */}
        {request.reviewed_at && request.status !== 'pending' && (
          <p className="text-xs text-muted-foreground">
            Reviewed {formatRelativeDateTime(request.reviewed_at)}
          </p>
        )}

        {/* Actions */}
        {(request.status === 'pending' || canEditDelete) && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
            {request.status === 'pending' ? (
              <>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Approval will sync this punch on {formatShortDate(request.request_date)}</span>
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDecline(request.id)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onApprove(request.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Approve
                  </Button>
                </div>
              </>
            ) : (
              canEditDelete && (
                <div className="flex gap-1 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(request)}
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(request.id)}
                    className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*  Summary Cards                                                             */
/* -------------------------------------------------------------------------- */

const SummaryCard = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'amber' | 'emerald' | 'red';
}) => {
  const toneClasses = {
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    red: { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  }[tone];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={cn('h-1.5 w-1.5 rounded-full', toneClasses.dot)} />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            </div>
            <p className="text-3xl font-semibold text-foreground tabular-nums">{value}</p>
          </div>
          <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', toneClasses.bg)}>
            <Icon className={cn('h-4 w-4', toneClasses.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*  Main                                                                      */
/* -------------------------------------------------------------------------- */

const TimeRequestsManagement = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobsiteFilter, setJobsiteFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('all');
  const [declineReason, setDeclineReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('active');

  const { user } = useAuth();
  const { data: requests = [], isLoading } = useMissedPunchRequests();
  const { data: jobsites = [] } = useJobsites('active');
  const approveMutation = useApproveMissedPunchRequest();
  const declineMutation = useDeclineMissedPunchRequest();
  const editMutation = useEditMissedPunchRequest();
  const deleteMutation = useDeleteMissedPunchRequest();

  // Stats
  const stats = useMemo(() => {
    const pending = requests.filter((r: any) => r.status === 'pending').length;
    const approved = requests.filter((r: any) => r.status === 'approved').length;
    const declined = requests.filter((r: any) => r.status === 'declined').length;
    return { pending, approved, declined };
  }, [requests]);

  const activeRequests = requests.filter(
    (r: any) => r.status === 'pending' || r.status === 'declined'
  );
  const archivedRequests = requests.filter((r: any) => r.status === 'approved');

  const matchesDateFilter = (dateStr: string) => {
    if (dateFilter === 'all') return true;
    if (!dateStr) return false;
    try {
      const d = parseISO(dateStr);
      if (dateFilter === 'today') return isToday(d);
      if (dateFilter === 'week') return isThisWeek(d);
      if (dateFilter === 'month') return isThisMonth(d);
    } catch {
      return false;
    }
    return true;
  };

  const getFilteredRequests = (requestList: any[]) =>
    requestList.filter((r: any) => {
      const statusMatch = statusFilter === 'all' || r.status === statusFilter;
      const jobsiteMatch = jobsiteFilter === 'all' || r.jobsite_id === jobsiteFilter;
      const dateMatch = matchesDateFilter(r.request_date);
      return statusMatch && jobsiteMatch && dateMatch;
    });

  const filteredActiveRequests = getFilteredRequests(activeRequests);
  const filteredArchivedRequests = getFilteredRequests(archivedRequests);

  const hasActiveFilters = statusFilter !== 'all' || jobsiteFilter !== 'all' || dateFilter !== 'all';

  const clearFilters = () => {
    setStatusFilter('all');
    setJobsiteFilter('all');
    setDateFilter('all');
  };

  const handleApprove = (requestId: string) => approveMutation.mutate(requestId);
  const handleDecline = (requestId: string) => setSelectedRequestId(requestId);

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

  const handleEdit = (request: any) => setEditingRequest(request);
  const handleDelete = (requestId: string) => setDeleteRequestId(requestId);

  const handleDeleteConfirm = () => {
    if (deleteRequestId) {
      deleteMutation.mutate(deleteRequestId);
      setDeleteRequestId(null);
    }
  };

  const handleEditSave = (formData: any) => {
    if (editingRequest) {
      editMutation.mutate({ requestId: editingRequest.id, updateData: formData });
      setEditingRequest(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Clock className="h-7 w-7 mx-auto mb-3 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Loading time requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Time Requests</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Review and approve employee missed-punch corrections
              </p>
            </div>
          </div>
        </div>

        {/* Sync hint */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Approved requests sync automatically to the Live Punch Monitor</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Pending Review" value={stats.pending} icon={Inbox} tone="amber" />
        <SummaryCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="emerald" />
        <SummaryCard label="Declined" value={stats.declined} icon={XCircle} tone="red" />
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <Activity className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>

              <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
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

              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateRangeFilter)}>
                <SelectTrigger className="h-9 text-sm">
                  <CalendarRange className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground self-end lg:self-auto"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="active" className="flex items-center gap-2 text-sm">
            <span>Active</span>
            <BadgeWithDot
              type="solid"
              customColor="hsl(38 92% 50%)"
              size="sm"
              hideDot
              className="ml-0.5 px-1.5"
            >
              {filteredActiveRequests.length}
            </BadgeWithDot>
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2 text-sm">
            <span>Approved & Archived</span>
            <BadgeWithDot
              type="solid"
              customColor="hsl(142 71% 45%)"
              size="sm"
              hideDot
              className="ml-0.5 px-1.5"
            >
              {filteredArchivedRequests.length}
            </BadgeWithDot>
          </TabsTrigger>
        </TabsList>

        {/* Active */}
        <TabsContent value="active" className="space-y-4 mt-4">
          {filteredActiveRequests.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Inbox className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">No active requests</h3>
                  <p className="text-xs text-muted-foreground">
                    {hasActiveFilters ? 'Try adjusting your filters.' : 'New requests will appear here for review.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredActiveRequests.map((request: any) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onDecline={handleDecline}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isArchived={false}
                  userRole={user?.role}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Archived */}
        <TabsContent value="archived" className="space-y-4 mt-4">
          {filteredArchivedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">No approved requests yet</h3>
                  <p className="text-xs text-muted-foreground">
                    Approved requests will be listed here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredArchivedRequests.map((request: any) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onApprove={() => {}}
                  onDecline={() => {}}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isArchived
                  userRole={user?.role}
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
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <X className="h-4 w-4 text-red-600" />
              Decline Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to decline this missed punch request?
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="decline-reason" className="text-xs font-medium">
                Reason for Decline (optional)
              </Label>
              <Textarea
                id="decline-reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Provide a reason for declining this request..."
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
              <Button variant="outline" className="sm:flex-1" onClick={() => setSelectedRequestId(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleDeclineConfirm}
                disabled={declineMutation.isPending}
                variant="destructive"
                className="sm:flex-1"
              >
                {declineMutation.isPending ? 'Declining...' : 'Confirm Decline'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteRequestId}
        onOpenChange={(open) => !open && setDeleteRequestId(null)}
        title="Delete Time Request"
        description="Are you sure you want to permanently delete this time request? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* Edit Dialog */}
      <EditRequestDialog
        request={editingRequest}
        jobsites={jobsites}
        onSave={handleEditSave}
        onClose={() => setEditingRequest(null)}
        isLoading={editMutation.isPending}
      />
    </div>
  );
};

export default TimeRequestsManagement;

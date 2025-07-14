import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useWeeklyTimesheets } from '@/hooks/useWeeklyTimesheets';
import { useWeeklyTimesheetActions } from '@/hooks/useWeeklyTimesheetActions';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Calendar, Check, X, Edit } from 'lucide-react';
import { format } from 'date-fns';
import TimesheetEditModal from '@/components/admin/timesheets/TimesheetEditModal';
import TimesheetFilters from '@/components/admin/timesheets/TimesheetFilters';

const EmployeeTimesheets = () => {
  const { user } = useAuth();
  const { approveTimesheet, rejectTimesheet, editTimesheet, isApproving, isRejecting, isEditing } = useWeeklyTimesheetActions();
  const [filters, setFilters] = useState({
    employeeName: '',
    weekEndingDate: '',
    status: 'all'
  });
  const [editingTimesheet, setEditingTimesheet] = useState<any>(null);
  
  const { data: timesheets = [], isLoading, error } = useWeeklyTimesheets(filters);
  const { data: employees = [] } = useEmployeeDirectory();
  
  // Only admins, management, and super_admins can access Employee Timesheets (not foremen for payroll)
  const isAuthorized = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management';

  const handleApprove = (timesheetId: string) => {
    approveTimesheet(timesheetId);
  };

  const handleReject = (timesheetId: string) => {
    rejectTimesheet(timesheetId);
  };

  const handleEdit = (timesheet: any) => {
    setEditingTimesheet(timesheet);
  };

  const handleSaveEdit = (updates: any, originalData: any) => {
    if (editingTimesheet) {
      editTimesheet({
        timesheetId: editingTimesheet.id,
        updates,
        originalData
      });
      setEditingTimesheet(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!isAuthorized) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">
            You don't have permission to view employee timesheets.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-600">
            Error loading timesheets. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-orange-600" />
            Employee Weekly Timesheet Submissions
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Review and approve manually submitted weekly timesheets from employees
          </p>
        </CardHeader>
      </Card>

      {/* Filters */}
      <TimesheetFilters
        filters={filters}
        onFiltersChange={setFilters}
        employees={employees}
      />

      {/* Timesheets Table */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">
            Weekly Timesheet Submissions ({timesheets.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-900">Employee</TableHead>
                  <TableHead className="font-semibold text-gray-900">Jobsite</TableHead>
                  <TableHead className="font-semibold text-gray-900">Week Starting</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Total Hours</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Total Pay</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Tax</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900">Submitted</TableHead>
                  <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Loading timesheets...
                    </TableCell>
                  </TableRow>
                ) : timesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No weekly timesheet submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  timesheets.map((timesheet) => (
                    <TableRow key={timesheet.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {timesheet.employee_name}
                      </TableCell>
                      <TableCell>{timesheet.jobsite_name}</TableCell>
                      <TableCell>
                        {format(new Date(timesheet.week_start_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {timesheet.total_hours.toFixed(2)}h
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        ${timesheet.gross_pay.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {timesheet.tax_included ? (
                          <span className="text-blue-600">
                            ${(timesheet.calculated_tax || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(timesheet.status)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(timesheet.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(timesheet)}
                            className="h-8 w-8 p-0"
                            title="Edit timesheet"
                          >
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          {timesheet.status !== 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(timesheet.id)}
                              disabled={isApproving}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Approve timesheet"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {timesheet.status !== 'rejected' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(timesheet.id)}
                              disabled={isRejecting}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Reject timesheet"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingTimesheet && (
        <TimesheetEditModal
          timesheet={editingTimesheet}
          onClose={() => setEditingTimesheet(null)}
          onSave={handleSaveEdit}
          isSaving={isEditing}
        />
      )}
    </div>
  );
};

export default EmployeeTimesheets;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWeeklyTimesheets } from '@/hooks/useWeeklyTimesheets';
import { useWeeklyTimesheetActions } from '@/hooks/useWeeklyTimesheetActions';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Calendar } from 'lucide-react';
import TimesheetEditModal from '@/components/admin/timesheets/TimesheetEditModal';
import TimesheetFilters from '@/components/admin/timesheets/TimesheetFilters';
import TimesheetTable from '@/components/admin/timesheets/TimesheetTable';

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
          <TimesheetTable
            timesheets={timesheets}
            isLoading={isLoading}
            onEdit={handleEdit}
            onApprove={handleApprove}
            onReject={handleReject}
            isApproving={isApproving}
            isRejecting={isRejecting}
          />
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

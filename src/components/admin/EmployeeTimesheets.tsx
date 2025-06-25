
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEmployeeTimesheets } from '@/hooks/useEmployeeTimesheets';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useTimesheetApproval } from '@/hooks/useTimesheetApproval';
import { useTimesheetRejection } from '@/hooks/useTimesheetRejection';
import { useTimesheetUpdate } from '@/hooks/useTimesheetUpdate';
import TimesheetTable from './timesheets/TimesheetTable';
import TimesheetFilters from './timesheets/TimesheetFilters';
import TimesheetEditModal from './timesheets/TimesheetEditModal';
import TimesheetErrorAlert from './timesheets/TimesheetErrorAlert';
import TimesheetPagination from './timesheets/TimesheetPagination';
import { Clock } from 'lucide-react';

const EmployeeTimesheets = () => {
  const [filters, setFilters] = useState({
    employeeName: '',
    weekEndingDate: '',
    status: 'all'
  });
  const [editingTimesheet, setEditingTimesheet] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: employees = [] } = useEmployeeDirectory();
  const { data: timesheets = [], isLoading, error } = useEmployeeTimesheets(filters);
  const approveMutation = useTimesheetApproval();
  const rejectMutation = useTimesheetRejection();
  const updateMutation = useTimesheetUpdate();

  const handleApprove = (timesheetId: string) => {
    approveMutation.mutate(timesheetId);
  };

  const handleReject = (timesheetId: string) => {
    rejectMutation.mutate(timesheetId);
  };

  const handleEdit = (timesheet: any) => {
    setEditingTimesheet(timesheet);
  };

  const handleSaveEdit = (updatedData: any) => {
    if (editingTimesheet) {
      updateMutation.mutate(
        { id: editingTimesheet.id, data: updatedData },
        {
          onSuccess: () => {
            setEditingTimesheet(null);
          }
        }
      );
    }
  };

  const handleClearFilters = () => {
    setFilters({
      employeeName: '',
      weekEndingDate: '',
      status: 'all'
    });
    setCurrentPage(1);
  };

  // Apply status filter
  const filteredTimesheets = filters.status === 'all' 
    ? timesheets 
    : timesheets.filter(timesheet => timesheet.status === filters.status);

  // Pagination
  const totalItems = filteredTimesheets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTimesheets = filteredTimesheets.slice(startIndex, startIndex + itemsPerPage);

  if (error) {
    return <TimesheetErrorAlert error={error} />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-600" />
            Employee Timesheets Management
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Review, approve, and manage employee timesheets
          </p>
        </CardHeader>
      </Card>

      <TimesheetFilters
        filters={filters}
        onFiltersChange={setFilters}
        employees={employees}
      />

      <TimesheetTable
        timesheets={paginatedTimesheets}
        onEdit={handleEdit}
        onApprove={handleApprove}
        onReject={handleReject}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        onClearFilters={handleClearFilters}
      />

      {totalPages > 1 && (
        <TimesheetPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}

      {editingTimesheet && (
        <TimesheetEditModal
          timesheet={editingTimesheet}
          onClose={() => setEditingTimesheet(null)}
          onSave={handleSaveEdit}
          isSaving={updateMutation.isPending}
        />
      )}
    </div>
  );
};

export default EmployeeTimesheets;

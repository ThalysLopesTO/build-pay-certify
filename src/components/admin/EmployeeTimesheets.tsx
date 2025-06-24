
import React, { useState } from 'react';
import { useEmployeeTimesheets } from '@/hooks/useEmployeeTimesheets';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useJobsites } from '@/hooks/useJobsites';
import { useTimesheetApproval } from '@/hooks/useTimesheetApproval';
import { useTimesheetRejection } from '@/hooks/useTimesheetRejection';
import TimesheetEditModal from './timesheets/TimesheetEditModal';
import TimesheetFilters from './timesheets/TimesheetFilters';
import TimesheetPagination from './timesheets/TimesheetPagination';
import TimesheetTable from './timesheets/TimesheetTable';
import TimesheetErrorAlert from './timesheets/TimesheetErrorAlert';

const ITEMS_PER_PAGE = 20;

const EmployeeTimesheets = () => {
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    employeeName: '',
    weekEndingDate: '', // This now stores the week start date string
    status: 'all', // all, pending, approved, rejected
  });

  // Convert the weekEndingDate filter (which is now week start date) to the format expected by the hook
  const queryFilters = {
    employeeName: filters.employeeName,
    weekStartDate: filters.weekEndingDate, // Pass week start date for filtering
    status: filters.status
  };

  const { data: timesheets = [], isLoading, error, refetch } = useEmployeeTimesheets(queryFilters);
  const { data: employees = [] } = useEmployeeDirectory();
  const { data: jobsites = [] } = useJobsites();
  const approvalMutation = useTimesheetApproval();
  const rejectionMutation = useTimesheetRejection();

  // Filter out rejected timesheets from the main view unless specifically filtering for them
  const filteredTimesheets = timesheets.filter(timesheet => {
    if (filters.status === 'rejected') return timesheet.status === 'rejected';
    if (filters.status === 'approved') return timesheet.status === 'approved';
    if (filters.status === 'pending') return !timesheet.status || timesheet.status === 'pending';
    // For 'all', show everything except rejected (unless specifically filtering for rejected)
    return timesheet.status !== 'rejected';
  });

  // Pagination
  const totalPages = Math.ceil(filteredTimesheets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTimesheets = filteredTimesheets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleApprove = async (timesheetId: string) => {
    try {
      await approvalMutation.mutateAsync(timesheetId);
      refetch();
    } catch (error) {
      console.error('Failed to approve timesheet:', error);
    }
  };

  const handleReject = async (timesheetId: string) => {
    try {
      await rejectionMutation.mutateAsync(timesheetId);
      refetch();
    } catch (error) {
      console.error('Failed to reject timesheet:', error);
    }
  };

  const handleEdit = (timesheet: any) => {
    setSelectedTimesheet(timesheet);
    setIsEditModalOpen(true);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    handleFilterChange({ employeeName: '', weekEndingDate: '', status: 'all' });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <TimesheetErrorAlert error={error} isLoading={isLoading} onRefetch={refetch} />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Employee Timesheets</h1>
        <p className="text-slate-600">Manage and approve weekly timesheets</p>
      </div>

      <TimesheetFilters 
        filters={filters}
        onFiltersChange={handleFilterChange}
        employees={employees}
      />

      <TimesheetTable
        timesheets={paginatedTimesheets}
        onEdit={handleEdit}
        onApprove={handleApprove}
        onReject={handleReject}
        isApproving={approvalMutation.isPending}
        isRejecting={rejectionMutation.isPending}
        onClearFilters={handleClearFilters}
      />

      {totalPages > 1 && (
        <TimesheetPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredTimesheets.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      <TimesheetEditModal
        timesheet={selectedTimesheet}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTimesheet(null);
        }}
        onSave={() => {
          refetch();
          setIsEditModalOpen(false);
          setSelectedTimesheet(null);
        }}
        jobsites={jobsites}
      />
    </div>
  );
};

export default EmployeeTimesheets;


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Edit, Check, X, AlertCircle } from 'lucide-react';
import { useEmployeeTimesheets } from '@/hooks/useEmployeeTimesheets';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useJobsites } from '@/hooks/useJobsites';
import { useTimesheetApproval } from '@/hooks/useTimesheetApproval';
import { useTimesheetRejection } from '@/hooks/useTimesheetRejection';
import TimesheetEditModal from './timesheets/TimesheetEditModal';
import TimesheetFilters from './timesheets/TimesheetFilters';
import TimesheetPagination from './timesheets/TimesheetPagination';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ITEMS_PER_PAGE = 20;

const EmployeeTimesheets = () => {
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    employeeName: '',
    weekEndingDate: '',
    status: 'all', // all, pending, approved, rejected
  });

  const { data: timesheets = [], isLoading, error, refetch } = useEmployeeTimesheets(filters);
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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">❌ Rejected</Badge>;
      case 'edited':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">✏️ Edited</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">🟡 Pending</Badge>;
    }
  };

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
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load timesheets: {error.message}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()} 
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
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

      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Weekly Timesheets ({filteredTimesheets.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-900">Employee</TableHead>
                  <TableHead className="font-semibold text-gray-900">Job Site</TableHead>
                  <TableHead className="font-semibold text-gray-900">Week Ending</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Mon</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Tue</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Wed</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Thu</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Fri</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Sat</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Sun</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Total</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTimesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                      {timesheets.length === 0 ? (
                        <div className="space-y-2">
                          <p>No timesheets found for the selected filters</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleFilterChange({ employeeName: '', weekEndingDate: '', status: 'all' })}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      ) : (
                        <p>No timesheets match the current filters</p>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTimesheets.map((timesheet) => (
                    <TableRow key={timesheet.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {timesheet.employee_name || 'Unknown Employee'}
                      </TableCell>
                      <TableCell>{timesheet.jobsite_name || 'Unknown Jobsite'}</TableCell>
                      <TableCell>
                        {new Date(timesheet.week_start_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-center">{timesheet.monday_hours || 0}</TableCell>
                      <TableCell className="text-center">{timesheet.tuesday_hours || 0}</TableCell>
                      <TableCell className="text-center">{timesheet.wednesday_hours || 0}</TableCell>
                      <TableCell className="text-center">{timesheet.thursday_hours || 0}</TableCell>
                      <TableCell className="text-center">{timesheet.friday_hours || 0}</TableCell>
                      <TableCell className="text-center">{timesheet.saturday_hours || 0}</TableCell>
                      <TableCell className="text-center">{timesheet.sunday_hours || 0}</TableCell>
                      <TableCell className="text-center font-semibold">
                        {timesheet.total_hours || 0}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(timesheet.status || 'pending')}
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
                            <Edit className="h-4 w-4" />
                          </Button>
                          {timesheet.status !== 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(timesheet.id)}
                              disabled={approvalMutation.isPending}
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
                              disabled={rejectionMutation.isPending}
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

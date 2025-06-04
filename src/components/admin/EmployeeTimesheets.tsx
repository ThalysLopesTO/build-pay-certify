
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Edit, Filter, Search } from 'lucide-react';
import { useEmployeeTimesheets } from '@/hooks/useEmployeeTimesheets';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useJobsites } from '@/hooks/useJobsites';
import TimesheetEditModal from './timesheets/TimesheetEditModal';
import TimesheetFilters from './timesheets/TimesheetFilters';

const EmployeeTimesheets = () => {
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    employeeName: '',
    weekEndingDate: '',
  });

  const { data: timesheets = [], isLoading, refetch } = useEmployeeTimesheets(filters);
  const { data: employees = [] } = useEmployeeDirectory();
  const { data: jobsites = [] } = useJobsites();

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">🟢 Approved</Badge>;
      case 'edited':
        return <Badge className="bg-orange-100 text-orange-800">🟠 Edited</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">🟡 Pending</Badge>;
    }
  };

  const handleApprove = async (timesheetId: string) => {
    // Implementation will be added in the hook
    console.log('Approving timesheet:', timesheetId);
  };

  const handleEdit = (timesheet: any) => {
    setSelectedTimesheet(timesheet);
    setIsEditModalOpen(true);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
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
            Weekly Timesheets
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
                {timesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                      No timesheets found
                    </TableCell>
                  </TableRow>
                ) : (
                  timesheets.map((timesheet) => (
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(timesheet)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {(!timesheet.status || timesheet.status === 'pending') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(timesheet.id)}
                              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            >
                              Approve
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

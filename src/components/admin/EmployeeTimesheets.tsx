
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEmployeeTimesheets } from '@/hooks/useEmployeeTimesheets';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import EditPunchModal from './timesheets/EditPunchModal';
import TimesheetRow from './timesheets/TimesheetRow';
import { Clock } from 'lucide-react';

const EmployeeTimesheets = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    employeeName: '',
    weekEndingDate: '',
    status: 'all'
  });
  const [editingTimesheet, setEditingTimesheet] = useState<any>(null);
  
  const { data: timesheets = [], isLoading, error } = useEmployeeTimesheets(filters);
  
  const isAuthorized = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'foreman';

  const handleEdit = (timesheet: any) => {
    setEditingTimesheet(timesheet);
  };

  const handleViewLocation = (timesheet: any) => {
    // Implementation for viewing location if needed
    console.log('View location for timesheet:', timesheet.id);
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
            <Clock className="h-6 w-6 text-orange-600" />
            Employee Timesheets Management
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Review and edit employee punch records
          </p>
        </CardHeader>
      </Card>

      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">
            Recent Punch Records ({timesheets.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-900">Employee</TableHead>
                  <TableHead className="font-semibold text-gray-900">Jobsite</TableHead>
                  <TableHead className="font-semibold text-gray-900">Clock In</TableHead>
                  <TableHead className="font-semibold text-gray-900">Clock Out</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Hours</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900">Location</TableHead>
                  <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Loading timesheets...
                    </TableCell>
                  </TableRow>
                ) : timesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No timesheet records found
                    </TableCell>
                  </TableRow>
                ) : (
                  timesheets.map((timesheet) => (
                    <TimesheetRow
                      key={timesheet.id}
                      timesheet={timesheet}
                      onEdit={handleEdit}
                      onViewLocation={handleViewLocation}
                      showEditButton={isAuthorized}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editingTimesheet && (
        <EditPunchModal
          isOpen={!!editingTimesheet}
          onClose={() => setEditingTimesheet(null)}
          timesheet={editingTimesheet}
        />
      )}
    </div>
  );
};

export default EmployeeTimesheets;

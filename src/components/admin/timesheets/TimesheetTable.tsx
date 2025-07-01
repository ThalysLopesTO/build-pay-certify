
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from 'lucide-react';
import TimesheetRow from './TimesheetRow';

interface TimesheetTableProps {
  timesheets: any[];
  onEdit: (timesheet: any) => void;
  onApprove: (timesheetId: string) => void;
  onReject: (timesheetId: string) => void;
  onViewLocation?: (timesheet: any) => void;
  isApproving: boolean;
  isRejecting: boolean;
  onClearFilters: () => void;
}

const TimesheetTable: React.FC<TimesheetTableProps> = ({
  timesheets,
  onEdit,
  onApprove,
  onReject,
  onViewLocation,
  isApproving,
  isRejecting,
  onClearFilters
}) => {
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-600" />
          Weekly Timesheets ({timesheets.length} total)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold text-gray-900">Employee</TableHead>
                <TableHead className="font-semibold text-gray-900">Job Site</TableHead>
                <TableHead className="font-semibold text-gray-900">Clock In</TableHead>
                <TableHead className="font-semibold text-gray-900">Clock Out</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center">Hours</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Location</TableHead>
                <TableHead className="font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <div className="space-y-2">
                      <p>No timesheets found for the selected filters</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onClearFilters}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                timesheets.map((timesheet) => (
                  <TimesheetRow
                    key={timesheet.id}
                    timesheet={timesheet}
                    onEdit={onEdit}
                    onViewLocation={onViewLocation}
                    showEditButton={true}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimesheetTable;

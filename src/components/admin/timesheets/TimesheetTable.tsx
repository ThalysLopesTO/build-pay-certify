import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TimesheetRow from './TimesheetRow';

interface TimesheetTableProps {
  timesheets: any[];
  isLoading: boolean;
  onEdit: (timesheet: any) => void;
  onApprove: (timesheetId: string) => void;
  onReject: (timesheetId: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

const TimesheetTable: React.FC<TimesheetTableProps> = ({
  timesheets,
  isLoading,
  onEdit,
  onApprove,
  onReject,
  isApproving,
  isRejecting
}) => {
  return (
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
              <TimesheetRow
                key={timesheet.id}
                timesheet={timesheet}
                onEdit={onEdit}
                onApprove={onApprove}
                onReject={onReject}
                isApproving={isApproving}
                isRejecting={isRejecting}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TimesheetTable;
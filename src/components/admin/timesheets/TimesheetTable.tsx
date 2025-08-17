import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import TimesheetRow from './TimesheetRow';

interface TimesheetTableProps {
  timesheets: any[];
  isLoading: boolean;
  onEdit: (timesheet: any) => void;
  onApprove: (timesheetId: string) => void;
  onReject: (timesheetId: string) => void;
  onDelete?: (timesheet: any) => void;
  isApproving: boolean;
  isRejecting: boolean;
  isDeleting?: boolean;
  selectedTimesheets?: Set<string>;
  onSelectAll?: (checked: boolean) => void;
  onSelectTimesheet?: (id: string, checked: boolean) => void;
}

const TimesheetTable: React.FC<TimesheetTableProps> = ({
  timesheets,
  isLoading,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  isApproving,
  isRejecting,
  isDeleting = false,
  selectedTimesheets,
  onSelectAll,
  onSelectTimesheet
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-white shadow-sm z-10">
          <tr className="border-b-2 border-slate-200">
            {selectedTimesheets && onSelectAll && onSelectTimesheet && (
              <th className="text-left p-4 font-semibold bg-slate-50">
                <Checkbox
                  checked={selectedTimesheets.size === timesheets.length && timesheets.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </th>
            )}
            <th className="text-left p-4 font-semibold bg-slate-50">Employee</th>
            <th className="text-left p-4 font-semibold bg-slate-50">Type</th>
            <th className="text-left p-4 font-semibold bg-slate-50">Jobsite</th>
            <th className="text-left p-4 font-semibold bg-slate-50">Period Start</th>
            <th className="text-center p-4 font-semibold bg-slate-50">Total Hours</th>
            <th className="text-center p-4 font-semibold bg-slate-50">Gross Pay</th>
            <th className="text-center p-4 font-semibold bg-slate-50">Deductions/Tax</th>
            <th className="text-center p-4 font-semibold bg-slate-50">Net Pay</th>
            <th className="text-left p-4 font-semibold bg-slate-50">Status</th>
            <th className="text-left p-4 font-semibold bg-slate-50">Submitted</th>
            <th className="text-left p-4 font-semibold bg-slate-50">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={selectedTimesheets ? 12 : 11} className="text-center py-8 text-slate-500">
                Loading timesheets...
              </td>
            </tr>
          ) : timesheets.length === 0 ? (
            <tr>
              <td colSpan={selectedTimesheets ? 12 : 11} className="text-center py-8 text-slate-500">
                No weekly timesheet submissions found
              </td>
            </tr>
          ) : (
            timesheets.map((timesheet) => (
              <TimesheetRow
                key={timesheet.id}
                timesheet={timesheet}
                onEdit={onEdit}
                onApprove={onApprove}
                onReject={onReject}
                onDelete={onDelete}
                isApproving={isApproving}
                isRejecting={isRejecting}
                isDeleting={isDeleting}
                selectedTimesheets={selectedTimesheets}
                onSelectTimesheet={onSelectTimesheet}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TimesheetTable;
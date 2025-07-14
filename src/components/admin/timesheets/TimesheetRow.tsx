import { TableCell, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import TimesheetStatusBadge from './TimesheetStatusBadge';
import TimesheetActions from './TimesheetActions';

interface TimesheetRowProps {
  timesheet: any;
  onEdit: (timesheet: any) => void;
  onApprove: (timesheetId: string) => void;
  onReject: (timesheetId: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

const TimesheetRow: React.FC<TimesheetRowProps> = ({
  timesheet,
  onEdit,
  onApprove,
  onReject,
  isApproving,
  isRejecting
}) => {
  return (
    <TableRow className="hover:bg-gray-50">
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
        <TimesheetStatusBadge status={timesheet.status} />
      </TableCell>
      <TableCell>
        {format(new Date(timesheet.created_at), 'MMM dd, yyyy')}
      </TableCell>
      <TableCell>
        <TimesheetActions
          timesheet={timesheet}
          onEdit={onEdit}
          onApprove={onApprove}
          onReject={onReject}
          isApproving={isApproving}
          isRejecting={isRejecting}
        />
      </TableCell>
    </TableRow>
  );
};

export default TimesheetRow;
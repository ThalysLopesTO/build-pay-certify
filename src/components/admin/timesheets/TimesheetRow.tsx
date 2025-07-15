import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  selectedTimesheets?: Set<string>;
  onSelectTimesheet?: (id: string, checked: boolean) => void;
}

const TimesheetRow: React.FC<TimesheetRowProps> = ({
  timesheet,
  onEdit,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  selectedTimesheets,
  onSelectTimesheet
}) => {
  return (
    <TableRow className="hover:bg-gray-50">
      {selectedTimesheets && onSelectTimesheet && (
        <TableCell>
          <Checkbox
            checked={selectedTimesheets.has(timesheet.id)}
            onCheckedChange={(checked) => onSelectTimesheet(timesheet.id, checked === true)}
          />
        </TableCell>
      )}
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{timesheet.is_manual_entry ? timesheet.manual_entry_name : timesheet.employee_name}</span>
          {timesheet.is_manual_entry && (
            <Badge variant="secondary" className="text-xs w-fit mt-1">
              Manual Entry
            </Badge>
          )}
        </div>
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
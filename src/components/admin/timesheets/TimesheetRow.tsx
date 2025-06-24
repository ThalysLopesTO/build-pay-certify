
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
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
        <TimesheetStatusBadge status={timesheet.status || 'pending'} />
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

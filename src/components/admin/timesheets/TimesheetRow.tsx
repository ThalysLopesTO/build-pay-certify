
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import TimesheetStatusBadge from './TimesheetStatusBadge';

interface TimesheetRowProps {
  timesheet: any;
  onEdit: (timesheet: any) => void;
  onViewLocation?: (timesheet: any) => void;
  showEditButton: boolean;
}

const TimesheetRow: React.FC<TimesheetRowProps> = ({
  timesheet,
  onEdit,
  onViewLocation,
  showEditButton
}) => {
  const isOpenShift = timesheet.check_in_time && !timesheet.check_out_time;

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">
        {timesheet.employee_name || 'Unknown Employee'}
      </TableCell>
      <TableCell>{timesheet.jobsite_name || 'Unknown Jobsite'}</TableCell>
      <TableCell>
        {timesheet.check_in_time 
          ? format(new Date(timesheet.check_in_time), 'MMM dd, yyyy h:mm a')
          : '--'
        }
      </TableCell>
      <TableCell>
        {timesheet.check_out_time ? (
          format(new Date(timesheet.check_out_time), 'MMM dd, yyyy h:mm a')
        ) : (
          <span className="text-red-600 font-medium flex items-center gap-1">
            {isOpenShift ? 'Open Shift' : '--'}
          </span>
        )}
      </TableCell>
      <TableCell className="text-center font-mono">
        {timesheet.hours_worked ? timesheet.hours_worked.toFixed(2) : '0.00'}h
      </TableCell>
      <TableCell>
        <TimesheetStatusBadge status={timesheet.status || 'pending'} />
      </TableCell>
      <TableCell>
        {onViewLocation ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewLocation(timesheet)}
            className="p-2 h-8 w-8"
            title="View Location"
          >
            <MapPin className="h-4 w-4 text-blue-500" />
          </Button>
        ) : (
          <span className="text-gray-400 text-sm">N/A</span>
        )}
      </TableCell>
      <TableCell>
        {showEditButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(timesheet)}
            className="p-2 h-8 w-8"
            title="Edit Punch Record"
          >
            <Edit className="h-4 w-4 text-blue-500" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default TimesheetRow;

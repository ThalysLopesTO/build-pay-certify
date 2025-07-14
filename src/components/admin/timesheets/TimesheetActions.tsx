import { Button } from '@/components/ui/button';
import { Check, X, Edit } from 'lucide-react';

interface TimesheetActionsProps {
  timesheet: any;
  onEdit: (timesheet: any) => void;
  onApprove: (timesheetId: string) => void;
  onReject: (timesheetId: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

const TimesheetActions: React.FC<TimesheetActionsProps> = ({
  timesheet,
  onEdit,
  onApprove,
  onReject,
  isApproving,
  isRejecting
}) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(timesheet)}
        className="h-8 w-8 p-0"
        title="Edit timesheet"
      >
        <Edit className="h-4 w-4 text-blue-500" />
      </Button>
      {timesheet.status !== 'approved' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onApprove(timesheet.id)}
          disabled={isApproving}
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
          onClick={() => onReject(timesheet.id)}
          disabled={isRejecting}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Reject timesheet"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default TimesheetActions;
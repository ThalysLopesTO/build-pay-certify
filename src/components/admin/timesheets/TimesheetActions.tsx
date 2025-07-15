import { Button } from '@/components/ui/button';
import { Check, X, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import TimesheetPDFGenerator from './TimesheetPDFGenerator';

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
  const { user } = useAuth();
  
  // Check if user can export PDFs (Admin and Management only)
  const canExportPDF = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management';

  const handleDownloadPDF = async (timesheet: any) => {
    // This will be handled by the TimesheetPDFGenerator component
  };

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
      {canExportPDF && (
        <TimesheetPDFGenerator
          timesheet={timesheet}
          onDownloadSingle={handleDownloadPDF}
        />
      )}
      {timesheet.status !== 'approved' ? (
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
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReject(timesheet.id)}
          disabled={isRejecting}
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 opacity-50"
          title="Timesheet already approved - click to revert"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
      {timesheet.status !== 'rejected' ? (
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
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onApprove(timesheet.id)}
          disabled={isApproving}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-50"
          title="Timesheet already rejected - click to revert"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default TimesheetActions;
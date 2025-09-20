import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();

  // Mobile card layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Select all for mobile */}
        {selectedTimesheets && onSelectAll && onSelectTimesheet && (
          <div className="flex items-center space-x-2 p-4 bg-muted/30 rounded-lg">
            <Checkbox
              checked={selectedTimesheets.size === timesheets.length && timesheets.length > 0}
              onCheckedChange={onSelectAll}
            />
            <span className="text-sm font-medium">
              Select all ({timesheets.length} timesheets)
            </span>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading timesheets...
          </div>
        ) : timesheets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No weekly timesheet submissions found
          </div>
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
      </div>
    );
  }

  // Desktop table layout
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-background shadow-sm z-10">
          <tr className="border-b-2 border-border">
            {selectedTimesheets && onSelectAll && onSelectTimesheet && (
              <th className="text-left p-3 font-semibold bg-muted/50">
                <Checkbox
                  checked={selectedTimesheets.size === timesheets.length && timesheets.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </th>
            )}
            <th className="text-left p-3 font-semibold bg-muted/50">Employee</th>
            <th className="text-left p-3 font-semibold bg-muted/50">Type</th>
            <th className="text-left p-3 font-semibold bg-muted/50 hidden lg:table-cell">Jobsite</th>
            <th className="text-left p-3 font-semibold bg-muted/50 hidden xl:table-cell">Period</th>
            <th className="text-center p-3 font-semibold bg-muted/50">Hours</th>
            <th className="text-center p-3 font-semibold bg-muted/50">Gross</th>
            <th className="text-center p-3 font-semibold bg-muted/50 hidden lg:table-cell">Tax/Deductions</th>
            <th className="text-center p-3 font-semibold bg-muted/50">Net Pay</th>
            <th className="text-left p-3 font-semibold bg-muted/50">Status</th>
            <th className="text-left p-3 font-semibold bg-muted/50 hidden xl:table-cell">Submitted</th>
            <th className="text-left p-3 font-semibold bg-muted/50">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={selectedTimesheets ? 12 : 11} className="text-center py-8 text-muted-foreground">
                Loading timesheets...
              </td>
            </tr>
          ) : timesheets.length === 0 ? (
            <tr>
              <td colSpan={selectedTimesheets ? 12 : 11} className="text-center py-8 text-muted-foreground">
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
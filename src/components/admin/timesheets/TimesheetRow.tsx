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
  // Calculate deductions for employees
  const isEmployee = timesheet.worker_type === 'employee';
  const grossPay = timesheet.gross_pay || 0;
  
  let deductions = 0;
  let netPay = grossPay;
  
  if (isEmployee) {
    // Calculate deductions using rates from timesheet or defaults
    const incomeTaxRate = (timesheet.income_tax_rate || 12) / 100;
    const cppRate = (timesheet.cpp_rate || 5.95) / 100;
    const eiRate = (timesheet.ei_rate || 1.63) / 100;
    
    const incomeTax = grossPay * incomeTaxRate;
    const cpp = grossPay * cppRate;
    const ei = grossPay * eiRate;
    
    deductions = incomeTax + cpp + ei;
    netPay = grossPay - deductions;
  } else {
    // For subcontractors, net pay includes tax if applicable
    const tax = timesheet.tax_included ? (timesheet.calculated_tax || 0) : 0;
    netPay = grossPay + tax;
  }

  return (
    <tr className="border-b hover:bg-slate-50 transition-colors">
      {selectedTimesheets && onSelectTimesheet && (
        <td className="p-4">
          <Checkbox
            checked={selectedTimesheets.has(timesheet.id)}
            onCheckedChange={(checked) => onSelectTimesheet(timesheet.id, checked === true)}
          />
        </td>
      )}
      <td className="p-4 font-medium">
        <div className="flex items-center space-x-2">
          <span>{timesheet.is_manual_entry ? timesheet.manual_entry_name : timesheet.employee_name}</span>
          {timesheet.is_manual_entry && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
              Manual Entry
            </Badge>
          )}
        </div>
      </td>
      <td className="p-4">
        <Badge 
          variant={isEmployee ? "default" : "secondary"} 
          className={`text-xs ${
            isEmployee 
              ? "bg-blue-100 text-blue-800 border-blue-200" 
              : "bg-green-100 text-green-800 border-green-200"
          }`}
        >
          {isEmployee ? "Employee (Payroll)" : "Subcontractor"}
        </Badge>
      </td>
      <td className="p-4 text-sm">{timesheet.jobsite_name}</td>
      <td className="p-4 text-sm">
        {format(new Date(timesheet.week_start_date), 'MMM dd, yyyy')}
      </td>
      <td className="p-4 text-center font-mono text-sm">
        {timesheet.total_hours.toFixed(2)}h
      </td>
      <td className="p-4 text-center font-mono text-sm">
        ${grossPay.toFixed(2)}
      </td>
      <td className="p-4 text-center font-mono text-sm">
        {isEmployee ? (
          <span className="text-red-600">
            -${deductions.toFixed(2)}
          </span>
        ) : timesheet.tax_included ? (
          <span className="text-blue-600">
            +${(timesheet.calculated_tax || 0).toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>
      <td className="p-4 text-center font-mono text-sm font-semibold">
        ${netPay.toFixed(2)}
      </td>
      <td className="p-4">
        <TimesheetStatusBadge status={timesheet.status} />
      </td>
      <td className="p-4 text-sm">
        {format(new Date(timesheet.created_at), 'MMM dd, yyyy')}
      </td>
      <td className="p-4">
        <TimesheetActions
          timesheet={timesheet}
          onEdit={onEdit}
          onApprove={onApprove}
          onReject={onReject}
          isApproving={isApproving}
          isRejecting={isRejecting}
        />
      </td>
    </tr>
  );
};

export default TimesheetRow;
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import TimesheetStatusBadge from './TimesheetStatusBadge';
import TimesheetActions from './TimesheetActions';
import BiWeeklyPreview from './BiWeeklyPreview';
import { shouldShowDataWarning } from '@/utils/timesheetDataUtils';

interface TimesheetRowProps {
  timesheet: any;
  onEdit: (timesheet: any) => void;
  onApprove: (timesheetId: string) => void;
  onReject: (timesheetId: string) => void;
  onDelete?: (timesheet: any) => void;
  isApproving: boolean;
  isRejecting: boolean;
  isDeleting?: boolean;
  selectedTimesheets?: Set<string>;
  onSelectTimesheet?: (id: string, checked: boolean) => void;
}

const TimesheetRow: React.FC<TimesheetRowProps> = ({
  timesheet,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  isApproving,
  isRejecting,
  isDeleting = false,
  selectedTimesheets,
  onSelectTimesheet
}) => {
  const [showPreview, setShowPreview] = React.useState(false);
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

  return (<>
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
        <div className="flex items-center space-x-2 text-nowrap">
          <span>
            {timesheet.is_manual_entry 
              ? timesheet.manual_entry_name 
              : timesheet.employee_name || 'Former Employee'
            }
          </span>
          {timesheet.is_manual_entry && (
            <Badge variant="secondary" className="text-xs text-nowrap bg-blue-100 text-blue-700 border-blue-200">
              Manual Entry
            </Badge>
          )}
        </div>
      </td>
      <td className="p-4">
        <Badge 
          variant={isEmployee ? "default" : "outline"} 
          className="text-xs"
        >
          {isEmployee ? "Employee" : "Subcontractor"}
        </Badge>
      </td>
      <td className="p-4 text-sm">{timesheet.jobsite_name}</td>
      <td className="p-4 text-sm">
        {format(new Date(timesheet.week_start_date), 'MMM dd, yyyy')}
      </td>
      <td className="p-4 text-center font-mono text-sm">
        <div className="flex items-center justify-center gap-1">
          <span>
            {(timesheet.total_hours || 0).toFixed(2)}h
          </span>
          {shouldShowDataWarning(timesheet) && (
            <div title="Data inconsistency detected - hours may need verification">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          )}
        </div>
      </td>
      <td className="p-4 text-center font-mono text-sm">
        ${timesheet.gross_pay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="p-4 text-center font-mono text-sm">
        {isEmployee ? (
          <span className="text-red-600">
            -${timesheet.tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ) : timesheet.tax_included ? (
          <span className="text-blue-600">
            +${(timesheet.tax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>
      <td className="p-4 text-center font-mono text-sm font-semibold">
        ${timesheet.total_pay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          onDelete={onDelete}
          isApproving={isApproving}
          isRejecting={isRejecting}
          isDeleting={isDeleting}
          onTogglePreview={() => setShowPreview((v) => !v)}
        />
      </td>
    </tr>
    {showPreview && (
      <tr className="bg-slate-50/50">
        <td colSpan={selectedTimesheets ? 12 : 11} className="p-4">
          <BiWeeklyPreview timesheet={timesheet} frequency="bi-weekly" />
        </td>
      </tr>
    )}
    </>
  );
};

export default TimesheetRow;
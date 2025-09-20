/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const [expandedDetails, setExpandedDetails] = React.useState(false);
  const isMobile = useIsMobile();
  
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

  // Mobile card layout
  if (isMobile) {
    return (
      <>
        <Card className="w-full">
          <CardContent className="p-4">
            {/* Header with checkbox, name, and status */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1">
                {selectedTimesheets && onSelectTimesheet && (
                  <Checkbox
                    checked={selectedTimesheets.has(timesheet.id)}
                    onCheckedChange={(checked) => onSelectTimesheet(timesheet.id, checked === true)}
                    className="mt-1"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-sm">
                      {timesheet.is_manual_entry 
                        ? timesheet.manual_entry_name 
                        : timesheet.employee_name || 'Former Employee'
                      }
                    </h3>
                    {timesheet.is_manual_entry && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                        Manual
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={isEmployee ? "default" : "outline"} 
                      className="text-xs"
                    >
                      {isEmployee ? "Employee" : "Subcontractor"}
                    </Badge>
                    <TimesheetStatusBadge status={timesheet.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Key metrics grid */}
            <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-lg font-mono font-semibold">
                    {(timesheet.total_hours || 0).toFixed(1)}h
                  </span>
                  {shouldShowDataWarning(timesheet) && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Hours</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-semibold">
                  ${timesheet.gross_pay.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground">Gross Pay</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-semibold text-green-600">
                  ${timesheet.total_pay.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground">Net Pay</p>
              </div>
            </div>

            {/* Expandable details */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedDetails(!expandedDetails)}
              className="w-full mb-3 text-xs h-8"
            >
              {expandedDetails ? (
                <>Hide Details <ChevronUp className="h-3 w-3 ml-1" /></>
              ) : (
                <>Show Details <ChevronDown className="h-3 w-3 ml-1" /></>
              )}
            </Button>

            {expandedDetails && (
              <div className="space-y-2 mb-3 p-3 bg-muted/20 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jobsite:</span>
                  <span className="font-medium">{timesheet.jobsite.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period:</span>
                  <span>{format(new Date(timesheet.week_start_date), 'MMM dd')} - {format(new Date(timesheet.week_ending_date), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>{format(new Date(timesheet.created_at), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isEmployee ? 'Deductions:' : 'Tax:'}
                  </span>
                  <span className={isEmployee ? 'text-red-600' : 'text-blue-600'}>
                    {isEmployee ? (
                      `-$${timesheet.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    ) : timesheet.tax_included ? (
                      `+$${(timesheet.tax).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    ) : (
                      '-'
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-3">
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
            </div>
          </CardContent>
        </Card>
        
        {showPreview && (
          <div className="mt-2 p-4 bg-muted/30 rounded-lg">
            <BiWeeklyPreview timesheet={timesheet} frequency="bi-weekly" />
          </div>
        )}
      </>
    );
  }

  // Desktop table layout
  return (<>
    <tr className="border-b hover:bg-muted/50 transition-colors">
      {selectedTimesheets && onSelectTimesheet && (
        <td className="p-3">
          <Checkbox
            checked={selectedTimesheets.has(timesheet.id)}
            onCheckedChange={(checked) => onSelectTimesheet(timesheet.id, checked === true)}
          />
        </td>
      )}
      <td className="p-3 font-medium">
        <div className="flex items-center space-x-2">
          <span className="text-sm">
            {timesheet.is_manual_entry 
              ? timesheet.manual_entry_name 
              : timesheet.employee_name || 'Former Employee'
            }
          </span>
          {timesheet.is_manual_entry && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
              Manual
            </Badge>
          )}
        </div>
      </td>
      <td className="p-3">
        <Badge 
          variant={isEmployee ? "default" : "outline"} 
          className="text-xs"
        >
          {isEmployee ? "Employee" : "Subcontractor"}
        </Badge>
      </td>
      <td className="p-3 text-sm hidden lg:table-cell">{timesheet.jobsite.name}</td>
      <td className="p-3 text-sm hidden xl:table-cell">
        {format(new Date(timesheet.week_start_date), 'MMM dd')}
      </td>
      <td className="p-3 text-center font-mono text-sm">
        <div className="flex items-center justify-center gap-1">
          <span>
            {(timesheet.total_hours || 0).toFixed(1)}h
          </span>
          {shouldShowDataWarning(timesheet) && (
            <div title="Data inconsistency detected - hours may need verification">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          )}
        </div>
      </td>
      <td className="p-3 text-center font-mono text-sm">
        ${timesheet.gross_pay.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
      <td className="p-3 text-center font-mono text-sm hidden lg:table-cell">
        {isEmployee ? (
          <span className="text-red-600">
            -${timesheet.tax.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        ) : timesheet.tax_included ? (
          <span className="text-blue-600">
            +${(timesheet.tax).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="p-3 text-center font-mono text-sm font-semibold">
        ${timesheet.total_pay.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
      <td className="p-3">
        <TimesheetStatusBadge status={timesheet.status} />
      </td>
      <td className="p-3 text-sm hidden xl:table-cell">
        {format(new Date(timesheet.created_at), 'MMM dd')}
      </td>
      <td className="p-3">
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
      <tr className="bg-muted/50">
        <td colSpan={selectedTimesheets ? 12 : 11} className="p-4">
          <BiWeeklyPreview timesheet={timesheet} frequency="bi-weekly" />
        </td>
      </tr>
    )}
    </>
  );
};

export default TimesheetRow;
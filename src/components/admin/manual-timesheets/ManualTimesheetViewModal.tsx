import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { ManualTimesheet } from '@/hooks/useManualTimesheets';
import { formatDateLong } from '@/utils/manualTimesheetDays';

interface Props {
  timesheet: ManualTimesheet | null;
  onClose: () => void;
}

const formatCurrency = (n: number) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const ManualTimesheetViewModal: React.FC<Props> = ({ timesheet, onClose }) => {
  return (
    <Dialog open={!!timesheet} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Timesheet Details</DialogTitle>
        </DialogHeader>
        {timesheet && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase">Employee</p>
                <p className="font-medium">{timesheet.employee_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Project</p>
                <p className="font-medium">{timesheet.project_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Pay Period</p>
                <p className="font-medium">
                  {formatDateLong(timesheet.pay_period_start)} – {formatDateLong(timesheet.pay_period_end)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Type</p>
                <p className="font-medium capitalize">{timesheet.timesheet_type}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Daily Hours
              </p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Day</th>
                      <th className="text-right p-2 font-medium">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {timesheet.daily_hours.map((d) => (
                      <tr key={d.date}>
                        <td className="p-2">{formatDateLong(d.date)}</td>
                        <td className="p-2 text-muted-foreground">{d.day}</td>
                        <td className="p-2 text-right font-mono">{Number(d.hours).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Hours</span>
                <span className="font-medium">{Number(timesheet.total_hours).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="font-medium">{formatCurrency(Number(timesheet.hourly_rate))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Extra Amount</span>
                <span className="font-medium">{formatCurrency(Number(timesheet.extra_amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(Number(timesheet.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tax{timesheet.tax_percent && Number(timesheet.tax_percent) > 0 ? ` (${Number(timesheet.tax_percent)}%)` : ''}
                </span>
                <span className="font-medium">{formatCurrency(Number(timesheet.tax_amount))}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Total Payment</span>
                <span className="font-bold text-primary">
                  {formatCurrency(Number(timesheet.total_payment))}
                </span>
              </div>
            </div>

            {timesheet.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
                    {timesheet.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

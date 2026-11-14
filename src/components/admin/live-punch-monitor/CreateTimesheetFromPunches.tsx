/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import type { EmployeeBreakdown } from '@/hooks/useEmployeeHoursBreakdown';
import { buildTimesheetFromPunches } from '@/utils/punchesToTimesheet';
import { formatDateLong } from '@/utils/manualTimesheetDays';

interface CreateTimesheetFromPunchesProps {
  employee: EmployeeBreakdown;
  startDate: Date;
  endDate: Date;
}

const money = (n: number) => `$${n.toFixed(2)}`;

// "Create Timesheet" button for one employee in the Daily Hours Summary.
// Shows a preview first; the hourly timesheet is only saved on "Create".
export const CreateTimesheetFromPunches: React.FC<CreateTimesheetFromPunchesProps> = ({
  employee,
  startDate,
  endDate,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState(false);

  const timesheet = useMemo(
    () => buildTimesheetFromPunches(employee, startDate, endDate),
    [employee, startDate, endDate],
  );

  // Warn if this person already has a timesheet for the same dates
  const existing = useQuery({
    queryKey: ['manual-timesheet-duplicates', user?.companyId, employee.userId, timesheet.pay_period_start, timesheet.pay_period_end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual_timesheets' as any)
        .select('id, created_at, total_hours')
        .eq('company_id', user!.companyId)
        .eq('employee_id', employee.userId)
        .eq('pay_period_start', timesheet.pay_period_start)
        .eq('pay_period_end', timesheet.pay_period_end);
      if (error) throw error;
      return (data ?? []) as unknown as Array<{ id: string; created_at: string; total_hours: number }>;
    },
    enabled: open && !!user?.companyId,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user?.companyId || !user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('manual_timesheets' as any)
        .insert({ ...timesheet, company_id: user.companyId, created_by: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['manual-timesheet-duplicates'] });
      toast.success(`Timesheet created for ${timesheet.employee_name}`, {
        description: 'You can find it in Time Sheet → All Timesheets.',
      });
      setCreated(true);
      setOpen(false);
    },
    onError: (e: any) => toast.error('Failed to create timesheet', { description: e.message }),
  });

  const workedDays = timesheet.daily_hours.filter(d => d.hours > 0);
  const duplicates = existing.data ?? [];
  const nothingToCreate = timesheet.total_hours <= 0;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={created ? 'outline' : 'default'}
        className="h-8 gap-1.5"
        onClick={() => setOpen(true)}
      >
        {created ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <FileText className="h-3.5 w-3.5" />}
        {created ? 'Timesheet created' : 'Create Timesheet'}
      </Button>

      <Dialog open={open} onOpenChange={(next) => { if (!create.isPending) setOpen(next); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create timesheet for {timesheet.employee_name}</DialogTitle>
            <DialogDescription>
              {formatDateLong(timesheet.pay_period_start)} – {formatDateLong(timesheet.pay_period_end)} · it will be
              added to All Timesheets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            {duplicates.length > 0 && (
              <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {duplicates.length === 1 ? 'A timesheet' : `${duplicates.length} timesheets`} for this person and
                  these dates already {duplicates.length === 1 ? 'exists' : 'exist'}. Creating another will add a
                  duplicate.
                </span>
              </div>
            )}

            <div className="rounded-md border divide-y">
              {workedDays.length === 0 ? (
                <p className="p-3 text-muted-foreground">No completed hours in this range.</p>
              ) : (
                workedDays.map(d => (
                  <div key={d.date} className="flex justify-between px-3 py-1.5">
                    <span className="text-muted-foreground">{d.day.slice(0, 3)}, {formatDateLong(d.date)}</span>
                    <span className="font-medium tabular-nums">{d.hours.toFixed(2)} h</span>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <span className="text-muted-foreground">Project / jobsite</span>
              <span className="text-right font-medium truncate" title={timesheet.project_name}>{timesheet.project_name}</span>
              <span className="text-muted-foreground">Total hours</span>
              <span className="text-right font-medium tabular-nums">{timesheet.total_hours.toFixed(2)} h</span>
              <span className="text-muted-foreground">Hourly rate</span>
              <span className="text-right font-medium tabular-nums">{money(timesheet.hourly_rate)}</span>
              <span className="text-muted-foreground font-semibold">Total pay</span>
              <span className="text-right font-bold tabular-nums">{money(timesheet.total_payment)}</span>
            </div>

            {timesheet.hourly_rate === 0 && !nothingToCreate && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This employee has no hourly rate set, so the pay will be $0. You can edit the rate on the timesheet afterwards.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Uses paid hours (after breaks). Punches missing a clock-out are not counted.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || nothingToCreate || existing.isLoading}>
              {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {duplicates.length > 0 ? 'Create anyway' : 'Create Timesheet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateTimesheetFromPunches;

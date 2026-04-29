import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, FileText, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useJobsites } from '@/hooks/useJobsites';
import {
  buildDailyHours,
  type DayEntry,
  sumHours,
} from '@/utils/manualTimesheetDays';
import { DailyHoursGrid } from './DailyHoursGrid';
import { PaymentSummary } from './PaymentSummary';
import {
  useManualTimesheets,
  type ManualTimesheet,
  type ManualTimesheetInput,
} from '@/hooks/useManualTimesheets';
import { toast } from 'sonner';

interface HourlyTimesheetFormProps {
  initial?: ManualTimesheet | null;
  onSaved?: () => void;
  submitLabel?: string;
}

const formatDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseDate = (s?: string): Date | undefined => {
  if (!s) return undefined;
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export const HourlyTimesheetForm: React.FC<HourlyTimesheetFormProps> = ({
  initial,
  onSaved,
  submitLabel,
}) => {
  const { data: employees = [], isLoading: employeesLoading } = useEmployeeDirectory();
  const { data: jobsites = [], isLoading: jobsitesLoading } = useJobsites('all');
  const { create, update } = useManualTimesheets();

  const [employeeId, setEmployeeId] = useState<string>(initial?.employee_id ?? '');
  const [jobsiteId, setJobsiteId] = useState<string>(initial?.jobsite_id ?? '');
  const [customProject, setCustomProject] = useState<string>(
    initial && !initial.jobsite_id ? initial.project_name : ''
  );
  const [useCustom, setUseCustom] = useState<boolean>(initial ? !initial.jobsite_id : false);
  const [periodStart, setPeriodStart] = useState<string>(initial?.pay_period_start ?? '');
  const [periodEnd, setPeriodEnd] = useState<string>(initial?.pay_period_end ?? '');
  const [days, setDays] = useState<DayEntry[]>(initial?.daily_hours ?? []);
  const [hourlyRate, setHourlyRate] = useState<number>(Number(initial?.hourly_rate ?? 0));
  const [extra, setExtra] = useState<number>(Number(initial?.extra_amount ?? 0));
  // Initialize tax percent — back-fill from legacy tax_amount/subtotal if needed
  const [taxPercent, setTaxPercent] = useState<number>(() => {
    if (!initial) return 0;
    if (initial.tax_percent && Number(initial.tax_percent) > 0) return Number(initial.tax_percent);
    if (initial.subtotal && initial.tax_amount) {
      const pct = (Number(initial.tax_amount) / Number(initial.subtotal)) * 100;
      return Number.isFinite(pct) ? +pct.toFixed(2) : 0;
    }
    return 0;
  });
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');

  // Auto-fill rate when employee changes (only for new entries)
  useEffect(() => {
    if (initial) return;
    const emp = employees.find((e: any) => e.user_id === employeeId);
    if (emp?.hourly_rate != null) setHourlyRate(Number(emp.hourly_rate));
  }, [employeeId, employees, initial]);

  // Regenerate days when period changes (preserving entered hours)
  useEffect(() => {
    setDays(prev => buildDailyHours(periodStart, periodEnd, prev));
  }, [periodStart, periodEnd]);

  const totalHours = useMemo(() => sumHours(days), [days]);
  const subtotal = totalHours * hourlyRate + extra;
  const taxAmount = +(subtotal * (taxPercent / 100)).toFixed(2);
  const totalPayment = +(subtotal + taxAmount).toFixed(2);

  const employee = employees.find((e: any) => e.user_id === employeeId);
  const employeeName = employee
    ? `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim() || 'Unknown'
    : '';

  const handleDayChange = (i: number, hours: number) => {
    setDays(prev => prev.map((d, idx) => (idx === i ? { ...d, hours } : d)));
  };

  const projectName = useCustom
    ? customProject.trim()
    : jobsites.find((j: any) => j.id === jobsiteId)?.name ?? '';

  const isSaving = create.isPending || update.isPending;

  const handleSubmit = async () => {
    if (!employeeId || !employeeName) return toast.error('Select an employee');
    if (!projectName) return toast.error('Select a jobsite or enter a project name');
    if (!periodStart || !periodEnd) return toast.error('Select pay period');
    if (days.length === 0) return toast.error('Pay period is invalid');
    if (days.length > 60) return toast.error('Pay period too long (max 60 days)');

    const input: ManualTimesheetInput = {
      employee_id: employeeId,
      employee_name: employeeName,
      timesheet_type: 'hourly',
      jobsite_id: useCustom ? null : jobsiteId || null,
      project_name: projectName,
      pay_period_start: periodStart,
      pay_period_end: periodEnd,
      daily_hours: days,
      total_hours: totalHours,
      hourly_rate: hourlyRate,
      extra_amount: extra,
      subtotal,
      tax_percent: taxPercent,
      tax_amount: taxAmount,
      total_payment: totalPayment,
      notes: notes.trim() || null,
    };

    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, input });
      } else {
        await create.mutateAsync(input);
        // reset
        setEmployeeId('');
        setJobsiteId('');
        setCustomProject('');
        setUseCustom(false);
        setPeriodStart('');
        setPeriodEnd('');
        setDays([]);
        setHourlyRate(0);
        setExtra(0);
        setTaxPercent(0);
        setNotes('');
      }
      onSaved?.();
    } catch {
      // toast handled in hook
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee */}
          <div className="space-y-1.5">
            <Label>Select Employee *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId} disabled={employeesLoading}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={employeesLoading ? 'Loading...' : 'Choose employee'} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e: any) => (
                  <SelectItem key={e.user_id} value={e.user_id}>
                    {e.first_name} {e.last_name}
                    {e.position ? ` — ${e.position}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Project *</Label>
              <button
                type="button"
                onClick={() => setUseCustom(v => !v)}
                className="text-xs text-primary hover:underline"
              >
                {useCustom ? 'Choose from jobsites' : 'Enter custom name'}
              </button>
            </div>
            {useCustom ? (
              <Input
                placeholder="Type project name"
                value={customProject}
                onChange={e => setCustomProject(e.target.value)}
                className="h-10"
              />
            ) : (
              <Select value={jobsiteId} onValueChange={setJobsiteId} disabled={jobsitesLoading}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={jobsitesLoading ? 'Loading...' : 'Choose jobsite'} />
                </SelectTrigger>
                <SelectContent>
                  {jobsites.map((j: any) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Pay period start */}
          <div className="space-y-1.5">
            <Label>Pay Period Start *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-10',
                    !periodStart && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodStart ? new Date(`${periodStart}T12:00:00`).toLocaleDateString('en-US') : 'Pick start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseDate(periodStart)}
                  onSelect={d => d && setPeriodStart(formatDate(d))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Pay period end */}
          <div className="space-y-1.5">
            <Label>Pay Period End *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-10',
                    !periodEnd && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodEnd ? new Date(`${periodEnd}T12:00:00`).toLocaleDateString('en-US') : 'Pick end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseDate(periodEnd)}
                  onSelect={d => d && setPeriodEnd(formatDate(d))}
                  disabled={d => (periodStart ? d < new Date(`${periodStart}T00:00:00`) : false)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      <DailyHoursGrid days={days} onChange={handleDayChange} disabled={isSaving} />

      <PaymentSummary
        totalHours={totalHours}
        hourlyRate={hourlyRate}
        extraAmount={extra}
        taxPercent={taxPercent}
        onHourlyRateChange={setHourlyRate}
        onExtraChange={setExtra}
        onTaxPercentChange={setTaxPercent}
        disabled={isSaving}
      />

      <Card className="p-4 md:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe the work performed, materials used, observations…"
          rows={5}
          disabled={isSaving}
          className="resize-y"
        />
        <p className="text-xs text-muted-foreground">
          These notes will be included in the PDF export.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSaving} size="lg" className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitLabel ?? (initial ? 'Update Timesheet' : 'Create Timesheet')}
        </Button>
      </div>
    </div>
  );
};

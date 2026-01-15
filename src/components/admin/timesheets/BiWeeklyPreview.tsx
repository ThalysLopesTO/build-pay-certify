import React from 'react';
import { format, addDays } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface BiWeeklyPreviewProps {
  timesheet: any;
  frequency?: 'weekly' | 'bi-weekly';
}

const parseBiWeeklyDays = (notes?: string): { date: string; label: string; hours: number }[] | null => {
  if (!notes) return null;
  try {
    const line = notes.split('\n').find((l) => l.startsWith('__biweekly_json__='));
    if (!line) return null;
    const json = JSON.parse(atob(line.split('=')[1]));
    if (Array.isArray(json?.days) && json.days.length === 14) return json.days as any[];
    return null;
  } catch {
    return null;
  }
};

const DayCell = ({ title, subtitle, value }: { title: string; subtitle: string; value: number | string }) => (
  <div className="rounded-md border border-border bg-card p-2 text-center shadow-sm">
    <div className="text-xs text-muted-foreground">{title}</div>
    <div className="text-[11px] text-muted-foreground/80">{subtitle}</div>
    <div className="mt-1 font-semibold text-foreground">{typeof value === 'number' ? value.toFixed(2) : value}</div>
  </div>
);

const Section = ({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="mb-3 rounded-lg border border-border bg-muted/30 shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          type="button"
          className="flex w-full items-center justify-between px-3 py-3 min-h-11 text-left transition-colors hover:bg-muted/50"
        >
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{title}</span>
            <span className="text-xs text-muted-foreground">{open ? `Collapse ${title}` : `Expand ${title}`}</span>
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const BiWeeklyPreview: React.FC<BiWeeklyPreviewProps> = ({ timesheet, frequency = 'bi-weekly' }) => {
  const periodDays = timesheet.periods?.reduce((sum, period: any) => sum + (period.days?.length ?? 0), 0) ?? 0;
  // Parse at noon to avoid timezone boundary issues (off-by-one day)
  const dateStr = timesheet.week_start_date;
  const start = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
  const end = addDays(start, periodDays - 1);
  const periodLabel = `${format(start, 'MMM dd')} – ${format(end, 'MMM dd')}`;

  const parsed = frequency === 'bi-weekly' ? parseBiWeeklyDays(timesheet.notes) : null;

  // Build day data
  const days: { label: string; date: string; hours: number }[] = [];
  for (let i = 0; i < (parsed ? 14 : 7); i++) {
    const d = addDays(start, i);
    const label = format(d, 'EEE');
    const date = format(d, 'MMM dd');
    let hours = 0;
    if (parsed) {
      hours = Number(parsed[i]?.hours || 0);
    } else {
      const dayIdx = d.getDay();
      const map = ['sunday_hours', 'monday_hours', 'tuesday_hours', 'wednesday_hours', 'thursday_hours', 'friday_hours', 'saturday_hours'];
      hours = Number(timesheet[map[dayIdx]] || 0);
    }
    days.push({ label, date, hours });
  }

  const week1 = days.slice(0, Math.min(7, days.length));
  const week2 = parsed ? days.slice(7, 14) : [];
  const totalWeek1 = week1.reduce((s, d) => s + d.hours, 0);
  const totalWeek2 = week2.reduce((s, d) => s + d.hours, 0);
  const grandTotal = Number(timesheet.total_hours || totalWeek1 + totalWeek2 || 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 text-sm text-muted-foreground">Timesheet Period: <span className="font-semibold text-foreground">{periodLabel}</span></div>

      <div className="divide-y divide-border">
        {timesheet.periods.map((w, i) => {
          const totalWeek = w.days.reduce((s, d) => {
            const hours = Object.values(d)[0] as number;
            return s + (hours || 0);
          }, 0);

          return (
            <Section key={i} title={`Week ${i + 1}`} defaultOpen>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {w.days.map((d, idx) => {
                  const c = addDays(start, i * 7 + idx); // ✅ correct day offset
                  const label = format(c, 'EEE');        // Mon, Tue, ...
                  const date = format(c, 'MMM dd');      // Jan 01

                  const hours = Object.values(d)[0] as number;

                  return (
                    <DayCell
                      key={`${i}-${idx}`}
                      title={label}
                      subtitle={date}
                      value={hours} 
                    />
                  )
                })}
              </div>
              <div className="mt-2 text-right text-sm text-muted-foreground">Week {i + 1} Total: <span className="font-semibold text-foreground">{totalWeek.toFixed(2)}h</span></div>
            </Section>
          )
        })}
      </div>
    </div>
  );
};

export default BiWeeklyPreview;

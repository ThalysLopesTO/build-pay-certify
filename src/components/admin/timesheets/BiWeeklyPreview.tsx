import React from 'react';
import { format, addDays } from 'date-fns';

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
  <div className="rounded-md border border-slate-200 bg-white p-2 text-center">
    <div className="text-xs text-slate-500">{title}</div>
    <div className="text-[11px] text-slate-400">{subtitle}</div>
    <div className="mt-1 font-semibold text-slate-800">{typeof value === 'number' ? value.toFixed(2) : value}</div>
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
    <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-sm font-medium text-slate-700">{title}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
};

const BiWeeklyPreview: React.FC<BiWeeklyPreviewProps> = ({ timesheet, frequency = 'bi-weekly' }) => {
  const periodDays = frequency === 'bi-weekly' ? 14 : 7;
  const start = new Date(timesheet.week_start_date);
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
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 text-sm text-slate-600">Timesheet Period: <span className="font-semibold text-slate-800">{periodLabel}</span></div>
      {frequency === 'bi-weekly' ? (
        <div>
          <Section title="Week 1" defaultOpen>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {week1.map((d, idx) => (
                <DayCell key={`${d.label}-${idx}`} title={`${d.label}`} subtitle={`${d.date}`} value={d.hours} />
              ))}
            </div>
            <div className="mt-2 text-right text-sm text-slate-600">Week 1 Total: <span className="font-semibold text-slate-800">{totalWeek1.toFixed(2)}h</span></div>
          </Section>
          <Section title="Week 2" defaultOpen={false}>
            {parsed ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {week2.map((d, idx) => (
                    <DayCell key={`${d.label}-w2-${idx}`} title={`${d.label}`} subtitle={`${d.date}`} value={d.hours} />
                  ))}
                </div>
                <div className="mt-2 text-right text-sm text-slate-600">Week 2 Total: <span className="font-semibold text-slate-800">{totalWeek2.toFixed(2)}h</span></div>
              </>
            ) : (
              <div className="text-xs text-slate-500">No second-week daily breakdown available.</div>
            )}
          </Section>
          <div className="mt-1 text-right text-sm text-slate-700">Grand Total: <span className="font-bold text-slate-900">{grandTotal.toFixed(2)}h</span></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {week1.map((d, idx) => (
            <DayCell key={`${d.label}-${idx}`} title={`${d.label}`} subtitle={`${d.date}`} value={d.hours} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BiWeeklyPreview;

import React, { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, StickyNote } from 'lucide-react';

import { useMyWeeklySchedule, buildWeekEntries, entryIsFilled } from '@/hooks/useWeeklySchedules';
import {
  addWeeks,
  formatDayLabel,
  formatScheduleTime,
  formatWeekRange,
  getWeekStart,
  isCurrentWeek,
  todayISO,
} from '@/utils/weeklyScheduleWeek';

const mapsUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/** Read-only view of the week the office published for this employee. */
export const MyWeeklySchedule: React.FC = () => {
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const { data: schedule, isLoading } = useMyWeeklySchedule(weekStart);

  const entries = schedule ? buildWeekEntries(schedule.week_start, schedule.entries) : [];
  const days = entries.filter(entryIsFilled);
  const today = todayISO();

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in">
      {/* Week navigator */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm">
        <button
          onClick={() => setWeekStart(w => addWeeks(w, -1))}
          className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 active:scale-95"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4 text-slate-600" />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">{formatWeekRange(weekStart)}</p>
          <p className="text-xs text-slate-500">
            {isCurrentWeek(weekStart) ? 'This week' : 'Week of ' + weekStart}
          </p>
        </div>

        <button
          onClick={() => setWeekStart(w => addWeeks(w, 1))}
          className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 active:scale-95"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </button>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your schedule…
        </div>
      ) : days.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-6 py-14 text-center shadow-sm">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100">
            <CalendarDays className="h-6 w-6 text-slate-400" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Nothing scheduled yet</p>
            <p className="text-sm text-slate-500">
              Your schedule for this week has not been published. Check back later.
            </p>
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          {days.map(entry => {
            const isToday = entry.date === today;
            return (
              <article
                key={entry.date}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                  isToday ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-200/70'
                }`}
              >
                <header
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    isToday ? 'bg-orange-50' : 'bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-900">
                    {formatDayLabel(entry.date)}
                  </span>
                  {isToday && (
                    <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                      Today
                    </span>
                  )}
                </header>

                <div className="space-y-2.5 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 font-semibold text-slate-900">
                      {entry.client_name || '—'}
                    </p>
                    {entry.service && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {entry.service}
                      </span>
                    )}
                  </div>

                  {entry.start_time && (
                    <p className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                      {formatScheduleTime(entry.start_time)}
                    </p>
                  )}

                  {entry.address && (
                    <a
                      href={mapsUrl(entry.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-sm text-blue-600 underline-offset-2 active:underline"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      {entry.address}
                    </a>
                  )}

                  {entry.notes && (
                    <p className="flex items-start gap-2 text-sm text-slate-600">
                      <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      {entry.notes}
                    </p>
                  )}
                </div>
              </article>
            );
          })}

          {schedule?.notes && (
            <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Week notes</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{schedule.notes}</p>
            </section>
          )}
        </section>
      )}
    </div>
  );
};

export default MyWeeklySchedule;

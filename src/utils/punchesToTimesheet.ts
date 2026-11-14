// Turns one employee's Live Punch hours (from the Daily Hours Summary) into
// an hourly timesheet for All Timesheets.

import { format } from 'date-fns';
import type { EmployeeBreakdown } from '@/hooks/useEmployeeHoursBreakdown';
import type { ManualTimesheetInput } from '@/hooks/useManualTimesheets';
import { buildDailyHours, sumHours } from '@/utils/manualTimesheetDays';

const round2 = (n: number) => Math.round(n * 100) / 100;

const toISODate = (d: Date) => format(d, 'yyyy-MM-dd');

// Minutes → hours with 2 decimals per day, rounded so the days add up to
// exactly the rounded total (38h 25m → 38.42 h, not 38.44 from rounding
// each day on its own). Leftover hundredths go to the days that lost most.
const splitHours = (minutesPerDay: number[]): number[] => {
  const exact = minutesPerDay.map(m => (m / 60) * 100); // in hundredths of an hour
  const floored = exact.map(Math.floor);
  const target = Math.round(exact.reduce((s, h) => s + h, 0));
  let leftover = target - floored.reduce((s, h) => s + h, 0);
  const byRemainder = exact
    .map((h, i) => ({ i, remainder: h - floored[i] }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { i } of byRemainder) {
    if (leftover <= 0) break;
    floored[i] += 1;
    leftover -= 1;
  }
  return floored.map(h => h / 100);
};

// One jobsite → link it. Several → list their names. None → "No jobsite".
const projectFor = (emp: EmployeeBreakdown): { jobsite_id: string | null; project_name: string } => {
  const sites = new Map<string, string>();
  for (const day of emp.days) {
    for (const punch of day.punches) {
      if (punch.isIncomplete || !punch.jobsiteId) continue;
      sites.set(punch.jobsiteId, punch.jobsiteName);
    }
  }
  if (sites.size === 1) {
    const [[id, name]] = [...sites.entries()];
    return { jobsite_id: id, project_name: name };
  }
  if (sites.size > 1) {
    return { jobsite_id: null, project_name: [...new Set(sites.values())].join(', ') };
  }
  return { jobsite_id: null, project_name: 'No jobsite' };
};

// The punch notes, one line per day, so they show up on the timesheet PDF.
const notesFor = (emp: EmployeeBreakdown, start: string, end: string) => {
  const lines = [`Created from Live Punch hours (${start} to ${end}).`];
  for (const day of emp.days) {
    const dayNotes = day.punches.map(p => p.note?.trim()).filter(Boolean);
    if (dayNotes.length === 0) continue;
    const label = format(new Date(`${day.date}T12:00:00`), 'EEE, MMM d');
    lines.push(`${label}: ${dayNotes.join(' / ')}`);
  }
  return lines.join('\n');
};

export const buildTimesheetFromPunches = (
  emp: EmployeeBreakdown,
  startDate: Date,
  endDate: Date,
): ManualTimesheetInput => {
  const start = toISODate(startDate);
  const end = toISODate(endDate);

  // Paid hours (after breaks) per day; incomplete punches already count as 0
  const paidMinutesByDay = new Map(emp.days.map(d => [d.date, d.dayNetMinutes]));
  const days = buildDailyHours(start, end);
  const hours = splitHours(days.map(day => paidMinutesByDay.get(day.date) ?? 0));
  const daily_hours = days.map((day, i) => ({ ...day, hours: hours[i] }));

  const total_hours = round2(sumHours(daily_hours));
  const hourly_rate = Number(emp.hourlyRate) || 0;
  const subtotal = round2(total_hours * hourly_rate);

  return {
    employee_id: emp.userId,
    employee_name: `${emp.firstName} ${emp.lastName}`.trim() || 'Unknown',
    employee_role: emp.position || null,
    timesheet_type: 'hourly',
    ...projectFor(emp),
    pay_period_start: start,
    pay_period_end: end,
    daily_hours,
    total_hours,
    hourly_rate,
    extra_amount: 0,
    subtotal,
    tax_percent: 0,
    tax_amount: 0,
    total_payment: subtotal,
    notes: notesFor(emp, start, end),
    employee_photo_url: emp.photoUrl,
  };
};

import { describe, expect, test } from 'bun:test';
import { buildTimesheetFromPunches } from '../src/utils/punchesToTimesheet';
import type { EmployeeBreakdown, PunchRecord } from '../src/hooks/useEmployeeHoursBreakdown';

const punch = (over: Partial<PunchRecord>): PunchRecord => ({
  id: Math.random().toString(36),
  checkIn: '2026-11-09T13:00:00Z',
  checkOut: '2026-11-09T22:00:00Z',
  breakMinutes: 0,
  grossMinutes: 0,
  netMinutes: 0,
  jobsiteId: 'site-1',
  jobsiteName: 'W.P.M.B Corp.',
  status: 'completed',
  note: null,
  isIncomplete: false,
  ...over,
});

const day = (date: string, netMinutes: number, punches: PunchRecord[]) => ({
  date,
  punches,
  dayGrossMinutes: netMinutes,
  dayNetMinutes: netMinutes,
  dayBreakMinutes: 0,
});

// A week like Christiane's in the screenshot: 9h56, 9h37, 10h01, 8h52 (2306 min)
const christiane: EmployeeBreakdown = {
  userId: 'user-cj',
  firstName: 'Christiane Jane',
  lastName: 'Budai',
  photoUrl: null,
  hourlyRate: 25,
  role: 'employee',
  position: 'Cleaner',
  totalGrossMinutes: 2305,
  totalNetMinutes: 2305,
  totalBreakMinutes: 0,
  days: [
    day('2026-11-09', 596, [punch({ note: 'Cliente Luiz' })]),
    day('2026-11-10', 577, [punch({})]),
    day('2026-11-11', 601, [punch({})]),
    day('2026-11-12', 532, [punch({ note: 'Cliente Luiz das 8 as 4:52pm' })]),
  ],
};

const range = (a: string, b: string) => [new Date(`${a}T12:00:00`), new Date(`${b}T12:00:00`)] as const;

describe('Live Punch hours to timesheet', () => {
  test('fills every day of the range with paid hours', () => {
    const t = buildTimesheetFromPunches(christiane, ...range('2026-11-09', '2026-11-13'));
    expect(t.pay_period_start).toBe('2026-11-09');
    expect(t.pay_period_end).toBe('2026-11-13');
    const exact = [596, 577, 601, 532, 0].map(m => m / 60);
    t.daily_hours.forEach((d, i) => expect(Math.abs(d.hours - exact[i])).toBeLessThanOrEqual(0.01));
    expect(t.daily_hours[4]).toMatchObject({ day: 'Friday', hours: 0 });
  });

  test('the days add up to the same total as the punches (2306 min = 38.43 h)', () => {
    const t = buildTimesheetFromPunches(christiane, ...range('2026-11-09', '2026-11-13'));
    expect(t.total_hours).toBe(38.43);
    const sum = Math.round(t.daily_hours.reduce((s, d) => s + d.hours, 0) * 100) / 100;
    expect(sum).toBe(38.43);
  });

  test('fractional minutes from real punches still add up exactly', () => {
    const odd = {
      ...christiane,
      days: [day('2026-11-09', 595.6, [punch({})]), day('2026-11-10', 577.2, [punch({})]), day('2026-11-11', 601.9, [punch({})])],
    };
    const t = buildTimesheetFromPunches(odd, ...range('2026-11-09', '2026-11-11'));
    expect(t.total_hours).toBe(Math.round(((595.6 + 577.2 + 601.9) / 60) * 100) / 100);
  });

  test('links the employee and uses their rate and trade', () => {
    const t = buildTimesheetFromPunches(christiane, ...range('2026-11-09', '2026-11-13'));
    expect(t.employee_id).toBe('user-cj');
    expect(t.employee_name).toBe('Christiane Jane Budai');
    expect(t.employee_role).toBe('Cleaner');
    expect(t.timesheet_type).toBe('hourly');
    expect(t.hourly_rate).toBe(25);
    expect(t.total_payment).toBe(960.75);
  });

  test('links the jobsite when every punch is on the same one', () => {
    const t = buildTimesheetFromPunches(christiane, ...range('2026-11-09', '2026-11-13'));
    expect(t.jobsite_id).toBe('site-1');
    expect(t.project_name).toBe('W.P.M.B Corp.');
  });

  test('lists all jobsite names when there are several', () => {
    const mixed = {
      ...christiane,
      days: [
        day('2026-11-09', 480, [punch({})]),
        day('2026-11-10', 480, [punch({ jobsiteId: 'site-2', jobsiteName: 'Ground Zero HQ' })]),
      ],
    };
    const t = buildTimesheetFromPunches(mixed, ...range('2026-11-09', '2026-11-10'));
    expect(t.jobsite_id).toBeNull();
    expect(t.project_name).toBe('W.P.M.B Corp., Ground Zero HQ');
  });

  test('copies punch notes into the timesheet notes', () => {
    const t = buildTimesheetFromPunches(christiane, ...range('2026-11-09', '2026-11-13'));
    expect(t.notes).toContain('Mon, Nov 9: Cliente Luiz');
    expect(t.notes).toContain('Thu, Nov 12: Cliente Luiz das 8 as 4:52pm');
  });

  test('pay is 0 when the employee has no rate', () => {
    const t = buildTimesheetFromPunches({ ...christiane, hourlyRate: 0 }, ...range('2026-11-09', '2026-11-13'));
    expect(t.total_payment).toBe(0);
    expect(t.total_hours).toBe(38.43);
  });
});

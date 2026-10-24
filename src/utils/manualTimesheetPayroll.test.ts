import { describe, expect, test } from 'bun:test';
import { fetchAllTimesheetPages, totalTimesheetPayroll } from './manualTimesheetPayroll';

describe('All Timesheets payroll', () => {
  test('includes every payment regardless of 10 or 20 row display limits', () => {
    const sheets = Array.from({ length: 35 }, () => ({ total_payment: 100.25 }));
    expect(totalTimesheetPayroll(sheets)).toBe(3508.75);
    expect(totalTimesheetPayroll(sheets.slice(0, 10))).toBe(1002.5);
    expect(totalTimesheetPayroll(sheets.slice(0, 20))).toBe(2005);
  });

  test('uses final stored payments including adjustments and tax, not hours or gross pay', () => {
    expect(totalTimesheetPayroll([
      { total_payment: 4332.8 },
      { total_payment: 433.28 },
      { total_payment: 247.5 },
      { total_payment: 1680 },
    ])).toBe(6693.58);
    expect(totalTimesheetPayroll([])).toBe(0);
  });

  test('totals only the matching records passed in after filtering', () => {
    const sheets = [
      { period: '2026-10-19', total_payment: 4332.8 },
      { period: '2026-10-19', total_payment: 433.28 },
      { period: '2026-10-05', total_payment: 1680 },
    ];
    expect(totalTimesheetPayroll(sheets.filter(sheet => sheet.period === '2026-10-19'))).toBe(4766.08);
  });

  test('fetches past the 1000-row API cap before calculating the total', async () => {
    const rows = Array.from({ length: 1201 }, () => ({ total_payment: 10 }));
    const ranges: number[][] = [];
    const all = await fetchAllTimesheetPages(async (from, to) => {
      ranges.push([from, to]);
      return { data: rows.slice(from, to + 1), error: null };
    });
    expect(all.length).toBe(1201);
    expect(totalTimesheetPayroll(all)).toBe(12010);
    expect(ranges).toEqual([[0, 499], [500, 999], [1000, 1499]]);
  });

  test('rejects incomplete data instead of returning an understated total', async () => {
    await expect(fetchAllTimesheetPages(async () => ({ data: null, error: new Error('Failed') }))).rejects.toThrow('Failed');
  });
});
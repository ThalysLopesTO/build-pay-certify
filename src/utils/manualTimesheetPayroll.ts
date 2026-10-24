interface PayrollTimesheet {
  total_payment: number;
}

/** Sum stored final payments in cents, before any display pagination. */
export const totalTimesheetPayroll = (timesheets: readonly PayrollTimesheet[]): number =>
  timesheets.reduce((cents, sheet) => cents + Math.round(Number(sheet.total_payment) * 100), 0) / 100;

/** Fetch every authorized row rather than stopping at the API's default row cap. */
export const fetchAllTimesheetPages = async <T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> => {
  const pageSize = 500;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
};
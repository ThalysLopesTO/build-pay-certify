/** Shared formatting helpers for the dashboard charts. */

/** Abbreviated currency for axis ticks: 12000 -> "$12k". */
export const fmtAxisK = (v: number): string =>
  Math.abs(v) >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`;

/** "YYYY-MM" -> short month label, e.g. "2026-06" -> "Jun". */
export const monthShort = (ym: string): string => {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
};

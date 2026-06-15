import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthlyData } from '@/hooks/useInvoiceAnalytics';
import { fmtAxisK, monthShort } from './chartHelpers';

interface Props {
  data: MonthlyData[];
  loading?: boolean;
}

/**
 * Argon-style "Sales Overview" equivalent: a dark gradient card with an area
 * chart of invoiced vs collected revenue over the last 12 months.
 */
export const RevenueOverviewChart: React.FC<Props> = ({ data, loading }) => {
  if (loading) return <Skeleton className="h-[360px] rounded-2xl" />;

  const chart = data.map((d) => ({
    label: monthShort(d.month),
    issued: Math.round(d.issued),
    paid: Math.round(d.paid),
  }));

  const hasData = chart.some((d) => d.issued > 0 || d.paid > 0);

  // Real 6-month-over-6-month growth in invoiced revenue (only shown if computable).
  const recent = chart.slice(-6).reduce((s, d) => s + d.issued, 0);
  const prior = chart.slice(-12, -6).reduce((s, d) => s + d.issued, 0);
  const growth = prior > 0 ? Math.round(((recent - prior) / prior) * 100) : null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-sm p-5 h-full flex flex-col min-h-[360px]">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Overview</p>
        <h3 className="text-lg font-bold text-white mt-0.5">Revenue Overview</h3>
        {growth != null && (
          <p className={`text-xs font-semibold mt-1 ${growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {growth >= 0 ? '▲' : '▼'} {growth >= 0 ? '+' : ''}{growth}% vs previous 6 months
          </p>
        )}
      </div>

      <div className="flex-1 min-h-[240px] relative">
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
            <TrendingUp className="h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">No invoice revenue yet</p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chart} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="rev-paid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="rev-issued" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.08} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtAxisK} width={48} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
              labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
              itemStyle={{ color: '#e2e8f0' }}
              formatter={(v: number, n: string) => [`$${v.toLocaleString()}`, n === 'paid' ? 'Collected' : 'Invoiced']}
            />
            <Area type="monotone" dataKey="issued" stroke="#e2e8f0" strokeWidth={2} fill="url(#rev-issued)" name="issued" />
            <Area type="monotone" dataKey="paid" stroke="#f97316" strokeWidth={2.5} fill="url(#rev-paid)" name="paid" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Collected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Invoiced
        </span>
      </div>
    </div>
  );
};

export default RevenueOverviewChart;

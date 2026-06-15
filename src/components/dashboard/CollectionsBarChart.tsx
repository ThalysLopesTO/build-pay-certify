import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthlyData } from '@/hooks/useInvoiceAnalytics';
import { fmtAxisK, monthShort } from './chartHelpers';

interface Props {
  data: MonthlyData[];
  loading?: boolean;
}

/**
 * Argon-style "Performance" equivalent: a light card with monthly collected
 * revenue bars (last 9 months).
 */
export const CollectionsBarChart: React.FC<Props> = ({ data, loading }) => {
  if (loading) return <Skeleton className="h-[360px] rounded-2xl" />;

  const chart = data.slice(-9).map((d) => ({
    label: monthShort(d.month),
    paid: Math.round(d.paid),
  }));

  const hasData = chart.some((d) => d.paid > 0);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5 h-full flex flex-col min-h-[360px]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Performance</p>
      <h3 className="text-lg font-bold text-slate-900 mt-0.5">Collections</h3>
      <p className="text-xs text-slate-400 mt-1 mb-3">Collected per month</p>

      <div className="flex-1 min-h-[220px] relative">
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
            <BarChart3 className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No collections yet</p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtAxisK} width={42} />
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
              labelStyle={{ color: '#64748b', marginBottom: 2 }}
              formatter={(v: number) => [`$${v.toLocaleString()}`, 'Collected']}
            />
            <Bar dataKey="paid" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={34} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CollectionsBarChart;

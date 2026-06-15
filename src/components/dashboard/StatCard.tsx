import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export type StatTone = 'orange' | 'emerald' | 'blue' | 'purple' | 'red' | 'amber';

const GRAD: Record<StatTone, string> = {
  orange:  'from-orange-500 to-amber-500',
  emerald: 'from-emerald-500 to-teal-500',
  blue:    'from-blue-500 to-indigo-500',
  purple:  'from-purple-500 to-fuchsia-500',
  red:     'from-rose-500 to-red-500',
  amber:   'from-amber-500 to-orange-500',
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: StatTone;
  /** Percent change vs prior period (e.g. 3.48 or -2.82). Null/undefined hides the delta. */
  delta?: number | null;
  deltaLabel?: string;
  /** Shown when there is no delta to display. */
  sublabel?: string;
  pulse?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * Argon-style stat card: clean white card with a big number, an optional
 * coloured ▲/▼ delta line, and a gradient icon badge.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  accent = 'orange',
  delta,
  deltaLabel = 'since last month',
  sublabel,
  pulse,
  loading,
  onClick,
}) => {
  if (loading) return <Skeleton className="h-[104px] rounded-2xl" />;

  const hasDelta = delta != null && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;
  const Wrapper: React.ElementType = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 sm:p-5 flex items-start justify-between gap-3 text-left w-full ${
        onClick ? 'hover:shadow-md hover:border-slate-300 transition-all' : ''
      }`}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums truncate">{value}</p>
        {hasDelta ? (
          <p className="text-xs mt-1.5 truncate">
            <span className={`font-semibold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
              {up ? '▲' : '▼'} {up ? '+' : ''}{delta!.toFixed(1)}%
            </span>
            <span className="text-slate-400"> {deltaLabel}</span>
          </p>
        ) : sublabel ? (
          <p className="text-xs text-slate-400 mt-1.5 truncate">{sublabel}</p>
        ) : null}
      </div>

      <div className={`relative p-3 rounded-2xl bg-gradient-to-br ${GRAD[accent]} shadow-md flex-shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
        {pulse && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
          </span>
        )}
      </div>
    </Wrapper>
  );
};

export default StatCard;

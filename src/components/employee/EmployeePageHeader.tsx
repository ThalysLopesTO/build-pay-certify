import React from 'react';
import { LucideIcon } from 'lucide-react';

type Tone = 'emerald' | 'orange' | 'blue' | 'red' | 'purple' | 'slate';

const TONE: Record<Tone, { chip: string; icon: string }> = {
  emerald: { chip: 'bg-emerald-50', icon: 'text-emerald-600' },
  orange:  { chip: 'bg-orange-50',  icon: 'text-orange-600' },
  blue:    { chip: 'bg-blue-50',    icon: 'text-blue-600' },
  red:     { chip: 'bg-red-50',     icon: 'text-red-600' },
  purple:  { chip: 'bg-purple-50',  icon: 'text-purple-600' },
  slate:   { chip: 'bg-slate-100',  icon: 'text-slate-600' },
};

interface EmployeePageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: Tone;
  /** Optional right-aligned action (button, badge, etc.) */
  action?: React.ReactNode;
}

/**
 * Consistent mobile-first page header for every employee sub-screen —
 * a tinted icon chip + title/subtitle, with an optional right action.
 */
const EmployeePageHeader: React.FC<EmployeePageHeaderProps> = ({
  title, subtitle, icon: Icon, tone = 'orange', action,
}) => {
  const t = TONE[tone];
  return (
    <header className="flex items-center gap-3 px-1">
      {Icon && (
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${t.chip}`}>
          <Icon className={`h-[22px] w-[22px] ${t.icon}`} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 truncate">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
};

export default EmployeePageHeader;

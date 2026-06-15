import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building, CheckCircle2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import EmployeeAvatar from '@/components/ui/employee-avatar';

// ── Shared tokens ────────────────────────────────────────────────────────────

export type Accent = 'orange' | 'emerald';
export type Tone = 'slate' | 'emerald' | 'blue' | 'purple' | 'orange' | 'red' | 'amber';

const TONE: Record<Tone, { bg: string; text: string }> = {
  slate:   { bg: 'bg-slate-100',   text: 'text-slate-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-600' },
  purple:  { bg: 'bg-purple-100',  text: 'text-purple-600' },
  orange:  { bg: 'bg-orange-100',  text: 'text-orange-600' },
  red:     { bg: 'bg-red-100',     text: 'text-red-600' },
  amber:   { bg: 'bg-amber-100',   text: 'text-amber-600' },
};

const ACCENT: Record<Accent, { ring: string; dot: string; chip: string; soft: string }> = {
  orange:  { ring: 'ring-orange-200',  dot: 'bg-orange-500',  chip: 'bg-orange-100 text-orange-700',  soft: 'bg-orange-50' },
  emerald: { ring: 'ring-emerald-200', dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700', soft: 'bg-emerald-50' },
};

/** Cap big counts so a data spike doesn't break the layout (e.g. 4169 → "99+"). */
export const capCount = (n: number) => (n > 99 ? '99+' : `${n}`);

// ── Top bar ──────────────────────────────────────────────────────────────────

interface TopBarProps {
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  roleLabel: string;
  companyName?: string | null;
  accent?: Accent;
  onViewProfile: () => void;
  /** Right-side slot, e.g. the WeatherChip. */
  rightSlot?: React.ReactNode;
}

export const DashboardTopBar: React.FC<TopBarProps> = ({
  firstName,
  lastName,
  photoUrl,
  roleLabel,
  companyName,
  accent = 'orange',
  onViewProfile,
  rightSlot,
}) => {
  const a = ACCENT[accent];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 sm:p-5 flex items-center gap-4">
      <div className={`rounded-full ring-2 ${a.ring} ring-offset-2 ring-offset-white flex-shrink-0`}>
        <EmployeeAvatar
          photoUrl={photoUrl ?? undefined}
          firstName={firstName ?? undefined}
          lastName={lastName ?? undefined}
          size="lg"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{today}</p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
          {greeting}, {firstName || 'there'} 👋
        </h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${a.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${a.dot} animate-pulse`} />
            {roleLabel}
          </span>
          {companyName && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Building className="h-3.5 w-3.5" />
              {companyName}
            </span>
          )}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
        {rightSlot}
        <Button variant="outline" size="sm" onClick={onViewProfile}>
          <Eye className="h-4 w-4 mr-2" /> Profile
        </Button>
      </div>
    </div>
  );
};

// ── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: Tone;
  pulse?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  icon: Icon,
  label,
  value,
  sublabel,
  tone = 'slate',
  pulse,
  loading,
  onClick,
}) => {
  if (loading) return <Skeleton className="h-[88px] rounded-2xl" />;
  const t = TONE[tone];
  const Wrapper: React.ElementType = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 flex items-center gap-3.5 text-left w-full ${
        onClick ? 'hover:shadow-md hover:border-slate-300 transition-all' : ''
      }`}
    >
      <div className={`relative p-2.5 rounded-xl flex-shrink-0 ${t.bg}`}>
        <Icon className={`h-5 w-5 ${t.text}`} />
        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{value}</p>
        <p className="text-xs text-slate-500 mt-1.5 truncate">{label}</p>
        {sublabel && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sublabel}</p>}
      </div>
    </Wrapper>
  );
};

// ── Section card (consistent wrapper) ────────────────────────────────────────

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  iconTone?: Tone;
  badge?: number;
  badgeTone?: 'red' | 'amber' | 'slate';
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon: Icon,
  iconTone = 'slate',
  badge,
  badgeTone = 'red',
  action,
  children,
  className = '',
}) => {
  const t = TONE[iconTone];
  const badgeCls =
    badgeTone === 'red' ? 'bg-red-500' : badgeTone === 'amber' ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col ${className}`}>
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <div className={`p-1.5 rounded-lg ${t.bg}`}>
          <Icon className={`h-4 w-4 ${t.text}`} />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {badge != null && badge > 0 && (
          <span className={`ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${badgeCls}`}>
            {capCount(badge)}
          </span>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="ml-auto text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center gap-1"
          >
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="px-3 pb-3 flex-1">{children}</div>
    </div>
  );
};

// ── Action item row ──────────────────────────────────────────────────────────

export interface ActionItemData {
  icon: React.ElementType;
  label: string;
  count: number;
  href: string;
  tone?: 'urgent' | 'warning' | 'normal';
}

const ROW_TONE = {
  urgent:  { chip: TONE.red,    badge: 'bg-red-100 text-red-700 border-red-200' },
  warning: { chip: TONE.amber,  badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  normal:  { chip: TONE.blue,   badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const ActionItem: React.FC<ActionItemData> = ({ icon: Icon, label, count, href, tone = 'normal' }) => {
  const navigate = useNavigate();
  if (count === 0) return null;
  const t = ROW_TONE[tone];
  return (
    <button
      onClick={() => navigate(href)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group text-left"
    >
      <div className={`p-2 rounded-lg flex-shrink-0 ${t.chip.bg}`}>
        <Icon className={`h-4 w-4 ${t.chip.text}`} />
      </div>
      <span className="flex-1 text-sm font-medium text-slate-700 truncate">{label}</span>
      <span className={`ml-auto flex-shrink-0 inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full border text-xs font-semibold ${t.badge}`}>
        {capCount(count)}
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  );
};

// ── Empty state ──────────────────────────────────────────────────────────────

export const AllClear: React.FC<{ message?: string }> = ({ message = 'All clear — nothing pending' }) => (
  <div className="flex flex-col items-center gap-2 py-8 text-center">
    <div className="p-2.5 rounded-full bg-emerald-50">
      <CheckCircle2 className="h-7 w-7 text-emerald-500" />
    </div>
    <p className="text-sm font-medium text-slate-500">{message}</p>
  </div>
);

// ── Quick action tile grid ───────────────────────────────────────────────────

export interface QuickAction {
  label: string;
  icon: React.ElementType;
  href: string;
  tone?: Tone;
}

export const QuickActions: React.FC<{ items: QuickAction[]; cols?: 2 | 3 }> = ({ items, cols = 2 }) => {
  const navigate = useNavigate();
  return (
    <div className={`grid ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
      {items.map((item) => {
        const t = TONE[item.tone ?? 'slate'];
        return (
          <button
            key={item.href + item.label}
            onClick={() => navigate(item.href)}
            className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-center group"
          >
            <div className={`p-2 rounded-lg ${t.bg} group-hover:scale-105 transition-transform`}>
              <item.icon className={`h-5 w-5 ${t.text}`} />
            </div>
            <span className="text-xs font-medium text-slate-600">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

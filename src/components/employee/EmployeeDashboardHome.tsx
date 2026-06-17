import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  Building2, Briefcase, Clock, Timer, FileText, AlertTriangle, Award,
  Settings, AlertCircle, CheckSquare, ChevronRight, ScrollText,
} from 'lucide-react';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTimesheets } from '@/hooks/useTimesheets';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { isMenuItemVisible } from '@/utils/menuPermissions';
import BirthdayWidget from '@/components/common/BirthdayWidget';
import ErrorBoundary from '@/components/common/ErrorBoundary';

interface EmployeeDashboardHomeProps {
  onNavigateToTab: (tab: string) => void;
}

type Tone = 'emerald' | 'orange' | 'blue' | 'red' | 'purple' | 'slate';

const TONE: Record<Tone, { chip: string; icon: string }> = {
  emerald: { chip: 'bg-emerald-50', icon: 'text-emerald-600' },
  orange:  { chip: 'bg-orange-50',  icon: 'text-orange-600' },
  blue:    { chip: 'bg-blue-50',    icon: 'text-blue-600' },
  red:     { chip: 'bg-red-50',     icon: 'text-red-600' },
  purple:  { chip: 'bg-purple-50',  icon: 'text-purple-600' },
  slate:   { chip: 'bg-slate-100',  icon: 'text-slate-600' },
};

const greetingFor = (d = new Date()) => {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const EmployeeDashboardHome: React.FC<EmployeeDashboardHomeProps> = ({ onNavigateToTab }) => {
  const { user } = useAuth();
  const { totalWeeklyHours, isLoading: hoursLoading } = useTimesheets();
  const { data: permissions } = useRolePermissions();

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.warn('User profile fetch error (non-fatal):', error.message);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const targetHours = 40;
  const safeWeeklyHours = isNaN(totalWeeklyHours) ? 0 : totalWeeklyHours;
  const progress = Math.min((safeWeeklyHours / targetHours) * 100, 100);

  const primaryActions: { id: string; title: string; subtitle: string; icon: React.ElementType; tone: Tone; tab: string }[] = [
    { id: 'time-tracker',          title: 'Clock In / Out', subtitle: 'Track your time',   icon: Timer,         tone: 'emerald', tab: 'time-tracker' },
    { id: 'tasks',                 title: 'My Tasks',       subtitle: 'View & complete',   icon: CheckSquare,   tone: 'blue',    tab: 'tasks' },
    { id: 'timesheet',             title: 'Timesheet',      subtitle: 'Submit your hours', icon: FileText,      tone: 'purple',  tab: 'timesheet' },
    { id: 'attention-report',      title: 'Report Issue',   subtitle: 'Flag a problem',    icon: AlertTriangle, tone: 'orange',  tab: 'attention-report' },
    { id: 'missed-punch-requests', title: 'Missed Punch',   subtitle: 'Request a fix',     icon: AlertCircle,   tone: 'red',     tab: 'missed-punch-requests' },
    { id: 'certificates',          title: 'Certificates',   subtitle: 'Your credentials',  icon: Award,         tone: 'slate',   tab: 'certificates' },
  ].filter((a) => isMenuItemVisible(a.id, permissions, user?.role || 'employee'));

  const secondaryActions: { id: string; title: string; icon: React.ElementType; tab: string }[] = [
    { id: 'my-reports',    title: 'My Reports',    icon: ScrollText, tab: 'my-reports' },
    { id: 'company-rules', title: 'Company Rules', icon: Building2,  tab: 'company-rules' },
    { id: 'settings',      title: 'Profile',       icon: Settings,   tab: 'settings' },
  ].filter((a) => isMenuItemVisible(a.id, permissions, user?.role || 'employee'));

  const firstName = userProfile?.first_name ?? user?.firstName ?? 'there';

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">

      {/* Greeting hero */}
      <section className="rounded-3xl bg-white border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigateToTab('settings')}
            className="shrink-0 rounded-full ring-2 ring-orange-100 active:scale-95 transition-transform"
            aria-label="View profile"
          >
            <EmployeeAvatar
              photoUrl={userProfile?.photo_url || undefined}
              firstName={firstName}
              lastName={userProfile?.last_name ?? user?.lastName}
              size="lg"
            />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500">{greetingFor()},</p>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight truncate">
              {firstName} <span className="inline-block">👋</span>
            </h1>
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ready to work
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-sm text-slate-500">
          {user?.companyName && (
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{user.companyName}</span>
            </span>
          )}
          {user?.trade && (
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
              {user.trade}
            </span>
          )}
        </div>
      </section>

      {/* This week's hours */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
              <Clock className="h-[18px] w-[18px] text-orange-400" />
            </div>
            <span className="text-sm font-medium text-slate-300">This week's hours</span>
          </div>
          <button
            onClick={() => onNavigateToTab('timesheet')}
            className="text-xs font-semibold text-orange-300 active:text-orange-200"
          >
            Timesheet
          </button>
        </div>

        <div className="mt-3 flex items-end gap-1.5">
          <span className="text-4xl font-bold tabular-nums tracking-tight">
            {hoursLoading ? '—' : safeWeeklyHours.toFixed(1)}
          </span>
          <span className="mb-1 text-sm text-slate-400">/ {targetHours}h</span>
        </div>

        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
            <span>{progress.toFixed(0)}% of weekly goal</span>
            <span>{Math.max(targetHours - safeWeeklyHours, 0).toFixed(1)}h to go</span>
          </div>
        </div>
      </section>

      <ErrorBoundary fallbackMinimal>
        <BirthdayWidget variant="orange" />
      </ErrorBoundary>

      {/* Quick actions */}
      {primaryActions.length > 0 && (
        <section className="space-y-3">
          <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-slate-400">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {primaryActions.map((a) => {
              const Icon = a.icon;
              const tone = TONE[a.tone];
              return (
                <button
                  key={a.id}
                  onClick={() => onNavigateToTab(a.tab)}
                  className="group flex flex-col gap-3 rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4 text-left transition-transform active:scale-[0.97]"
                >
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone.chip}`}>
                    <Icon className={`h-[22px] w-[22px] ${tone.icon}`} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 truncate">{a.title}</span>
                    <span className="block text-xs text-slate-500 truncate">{a.subtitle}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Secondary actions */}
      {secondaryActions.length > 0 && (
        <section className="overflow-hidden rounded-2xl bg-white border border-slate-200/70 shadow-sm divide-y divide-slate-100">
          {secondaryActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => onNavigateToTab(a.tab)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-slate-50"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100">
                  <Icon className="h-[18px] w-[18px] text-slate-600" />
                </span>
                <span className="flex-1 text-sm font-medium text-slate-800">{a.title}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default EmployeeDashboardHome;

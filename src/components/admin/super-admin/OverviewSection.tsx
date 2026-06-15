import React from 'react';
import { Building2, Users, Clock, AlertCircle, CheckCircle2, UserCheck, Inbox, CreditCard } from 'lucide-react';
import { usePlatformUsers } from '@/hooks/super-admin/usePlatformUsers';

interface Company {
  status: string;
  plan: string;
  subscription_status: string;
  trial_days_remaining: number | null;
  subscription_days_remaining: number | null;
}

interface Props {
  companies: Company[];
  pendingCount: number;
}

const KpiCard: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; tone: string; sub?: string }> = ({
  icon: Icon, label, value, tone, sub,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
    <div className={`p-2.5 rounded-xl flex-shrink-0 ${tone}`}><Icon className="h-5 w-5" /></div>
  </div>
);

export const OverviewSection: React.FC<Props> = ({ companies, pendingCount }) => {
  const { data: users = [] } = usePlatformUsers();

  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const trials = companies.filter(c => c.subscription_status === 'active' && (c.trial_days_remaining ?? 0) > 0).length;
  const expiring = companies.filter(c =>
    (c.status === 'active' && (c.subscription_days_remaining ?? 99) <= 7 && (c.subscription_days_remaining ?? 0) > 0) ||
    (c.subscription_status === 'active' && (c.trial_days_remaining ?? 99) <= 7 && (c.trial_days_remaining ?? 0) > 0)
  ).length;

  const activeUsers = users.filter(u => u.is_active).length;

  // Plan distribution
  const planCounts = companies.reduce<Record<string, number>>((acc, c) => {
    const p = c.plan || 'Free';
    acc[p] = (acc[p] ?? 0) + 1;
    return acc;
  }, {});
  const planRows = Object.entries(planCounts).sort((a, b) => b[1] - a[1]);
  const maxPlan = Math.max(1, ...planRows.map(([, n]) => n));

  // Role distribution
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});
  const roleRows = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Building2} label="Companies" value={companies.length} tone="bg-blue-50 text-blue-600" sub={`${activeCompanies} active`} />
        <KpiCard icon={Users} label="Total members" value={users.length} tone="bg-orange-50 text-orange-600" sub={`${activeUsers} active`} />
        <KpiCard icon={Clock} label="Trials" value={trials} tone="bg-emerald-50 text-emerald-600" sub="On free trial" />
        <KpiCard icon={AlertCircle} label="Expiring ≤ 7d" value={expiring} tone="bg-red-50 text-red-600" sub="Need attention" />
        <KpiCard icon={Inbox} label="Pending approvals" value={pendingCount} tone="bg-amber-50 text-amber-600" sub="Registration requests" />
        <KpiCard icon={CheckCircle2} label="Active companies" value={activeCompanies} tone="bg-emerald-50 text-emerald-600" />
        <KpiCard icon={UserCheck} label="Active members" value={activeUsers} tone="bg-indigo-50 text-indigo-600" />
        <KpiCard icon={CreditCard} label="Paid plans" value={companies.filter(c => (c.plan || 'Free') !== 'Free').length} tone="bg-purple-50 text-purple-600" />
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Plan distribution</h3>
          <div className="space-y-3">
            {planRows.length === 0 ? (
              <p className="text-sm text-slate-400">No data</p>
            ) : planRows.map(([plan, n]) => (
              <div key={plan}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{plan}</span>
                  <span className="text-slate-400 tabular-nums">{n}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500" style={{ width: `${(n / maxPlan) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Members by role</h3>
          <div className="grid grid-cols-2 gap-3">
            {roleRows.length === 0 ? (
              <p className="text-sm text-slate-400">No data</p>
            ) : roleRows.map(([role, n]) => (
              <div key={role} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="text-xs font-medium text-slate-600 capitalize">{role.replace('_', ' ')}</span>
                <span className="text-sm font-bold text-slate-900 tabular-nums">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;

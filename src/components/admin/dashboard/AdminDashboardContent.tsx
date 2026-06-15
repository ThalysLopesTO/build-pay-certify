import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building,
  Clock,
  DollarSign,
  Eye,
  FileText,
  HardHat,
  Inbox,
  MapPin,
  Receipt,
  ShieldAlert,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { useDashboardCommandCenter } from '@/hooks/useDashboardCommandCenter';
import { useInvoices } from '@/hooks/useInvoices';
import { useInvoiceAnalytics } from '@/hooks/useInvoiceAnalytics';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUserProfile } from '@/hooks/new/useUsers';
import WeatherChip from '@/components/dashboard/WeatherChip';
import StatCard from '@/components/dashboard/StatCard';
import RevenueOverviewChart from '@/components/dashboard/RevenueOverviewChart';
import CollectionsBarChart from '@/components/dashboard/CollectionsBarChart';
import {
  ActionItem,
  ActionItemData,
  AllClear,
  QuickAction,
  QuickActions,
  SectionCard,
} from '@/components/dashboard/primitives';
import BirthdayWidget from '@/components/common/BirthdayWidget';
import LicenseWarningBanner from '../../common/LicenseWarningBanner';
import EmployeeLimitCard from './EmployeeLimitCard';
import LiveActiveEmployees from './LiveActiveEmployees';

interface AdminDashboardContentProps {
  setActiveTab: (tab: string) => void;
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Live Punches',  icon: Clock,      href: '/admin/live-punch-monitor', tone: 'emerald' },
  { label: 'Payroll',       icon: Receipt,    href: '/admin/payroll-summary',    tone: 'blue' },
  { label: 'Daily Reports', icon: FileText,   href: '/admin/daily-reports',      tone: 'purple' },
  { label: 'Jobsites',      icon: MapPin,     href: '/admin/jobsites',           tone: 'orange' },
  { label: 'Invoices',      icon: TrendingUp, href: '/admin/invoices',           tone: 'emerald' },
  { label: 'Job Costing',   icon: Receipt,    href: '/admin/job-costing',        tone: 'blue' },
];

const pctChange = (cur: number, prev: number): number | null =>
  prev > 0 ? ((cur - prev) / prev) * 100 : null;

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ setActiveTab }) => {
  const { data: cc, isLoading } = useDashboardCommandCenter();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { monthlyData } = useInvoiceAnalytics(invoices);
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const navigate = useNavigate();

  const firstName = userProfile?.first_name || user?.firstName || 'Admin';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Financial stat-card figures (this month vs prior) from invoice analytics.
  const last = monthlyData[monthlyData.length - 1];
  const prev = monthlyData[monthlyData.length - 2];
  const issuedThisMonth = last?.issued ?? 0;
  const paidThisMonth = last?.paid ?? 0;
  const issuedDelta = pctChange(issuedThisMonth, prev?.issued ?? 0);
  const paidDelta = pctChange(paidThisMonth, prev?.paid ?? 0);

  const totalActionCount =
    (cc?.pendingTimesheets ?? 0) +
    (cc?.pendingMaterialRequests ?? 0) +
    (cc?.overdueInvoices ?? 0) +
    (cc?.pendingAttentionReports ?? 0) +
    (cc?.pendingTimeRequests ?? 0);

  const totalAlertCount = cc?.certsExpiringIn30Days ?? 0;

  const actionItems: ActionItemData[] = [
    {
      icon: Receipt,
      label: `Overdue invoices${cc?.overdueInvoicesAmount ? ` · ${fmt.format(cc.overdueInvoicesAmount)}` : ''}`,
      count: cc?.overdueInvoices ?? 0,
      href: '/admin/invoices',
      tone: 'urgent',
    },
    { icon: AlertTriangle, label: 'Attention reports',     count: cc?.pendingAttentionReports ?? 0, href: '/admin/attention-reports', tone: 'urgent' },
    { icon: Clock,         label: 'Timesheets to approve', count: cc?.pendingTimesheets ?? 0,       href: '/admin/timesheets',        tone: 'normal' },
    { icon: FileText,      label: 'Material requests',      count: cc?.pendingMaterialRequests ?? 0, href: '/admin/material-requests', tone: 'normal' },
    { icon: Clock,         label: 'Time requests',          count: cc?.pendingTimeRequests ?? 0,     href: '/admin/time-requests',     tone: 'normal' },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">

      {/* ── Hero band + overlapping stat cards ── */}
      <div>
        <div className="relative rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 shadow-lg p-5 sm:p-6 pb-16 lg:pb-20 overflow-hidden">
          <div className="absolute -top-24 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="rounded-full p-0.5 bg-white/25 flex-shrink-0">
              <EmployeeAvatar
                photoUrl={userProfile?.photo_url ?? undefined}
                firstName={userProfile?.first_name ?? user?.firstName ?? undefined}
                lastName={userProfile?.last_name ?? user?.lastName ?? undefined}
                size="lg"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">{today}</p>
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                {greeting}, {firstName} 👋
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-white/20 text-white capitalize">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {user?.role?.replace('_', ' ') || 'Admin'}
                </span>
                {user?.companyName && (
                  <span className="inline-flex items-center gap-1 text-xs text-white/80">
                    <Building className="h-3.5 w-3.5" />
                    {user.companyName}
                  </span>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
              <WeatherChip />
              <Button
                variant="ghost"
                className="h-9 text-white bg-white/15 hover:bg-white/25 hover:text-white border border-white/25"
                onClick={() => navigate('/admin/settings')}
              >
                <Eye className="h-4 w-4 mr-2" /> Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Stat cards overlap the band on desktop, stack on mobile */}
        <div className="relative z-20 -mt-10 lg:-mt-12 px-1 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            loading={invoicesLoading}
            label="Invoiced this month"
            value={fmt.format(issuedThisMonth)}
            icon={FileText}
            accent="orange"
            delta={issuedDelta}
            sublabel="No prior month data"
          />
          <StatCard
            loading={invoicesLoading}
            label="Collected this month"
            value={fmt.format(paidThisMonth)}
            icon={DollarSign}
            accent="emerald"
            delta={paidDelta}
            sublabel="No prior month data"
          />
          <StatCard
            loading={isLoading}
            label="On clock now"
            value={cc?.workersOnClockNow ?? 0}
            icon={HardHat}
            accent="blue"
            pulse
            sublabel="Live on site"
          />
          <StatCard
            loading={isLoading}
            label="Hours logged today"
            value={`${cc?.totalHoursToday ?? 0}h`}
            icon={Timer}
            accent="purple"
            sublabel="Across all sites"
          />
        </div>
      </div>

      <LicenseWarningBanner />
      <EmployeeLimitCard />

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueOverviewChart data={monthlyData} loading={invoicesLoading} />
        </div>
        <div className="lg:col-span-1">
          <CollectionsBarChart data={monthlyData} loading={invoicesLoading} />
        </div>
      </div>

      {/* ── Command center ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Needs Attention"
          icon={Inbox}
          iconTone="red"
          badge={totalActionCount}
          badgeTone="red"
          className="lg:col-span-2"
        >
          {isLoading ? (
            <div className="space-y-1 p-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : totalActionCount === 0 ? (
            <AllClear />
          ) : (
            <div className="space-y-0.5">
              {actionItems.map((item) => (
                <ActionItem key={item.label} {...item} />
              ))}
            </div>
          )}
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Alerts" icon={ShieldAlert} iconTone="amber" badge={totalAlertCount} badgeTone="amber">
            {isLoading ? (
              <div className="space-y-1 p-1">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : totalAlertCount === 0 ? (
              <AllClear message="No alerts right now" />
            ) : (
              <div className="space-y-0.5">
                <ActionItem
                  icon={ShieldAlert}
                  label="Certs expiring within 7 days"
                  count={cc?.certsExpiringIn7Days ?? 0}
                  href="/admin/employees"
                  tone="urgent"
                />
                <ActionItem
                  icon={ShieldAlert}
                  label="Certs expiring within 30 days"
                  count={Math.max((cc?.certsExpiringIn30Days ?? 0) - (cc?.certsExpiringIn7Days ?? 0), 0)}
                  href="/admin/employees"
                  tone="warning"
                />
              </div>
            )}
          </SectionCard>

          <BirthdayWidget variant="orange" />
        </div>
      </div>

      {/* ── Quick jump ── */}
      <SectionCard title="Quick Jump" icon={TrendingUp} iconTone="slate">
        <QuickActions items={QUICK_ACTIONS} cols={3} />
      </SectionCard>

      {/* ── Live activity ── */}
      <LiveActiveEmployees />
    </div>
  );
};

export default AdminDashboardContent;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  FileText,
  HardHat,
  Inbox,
  MapPin,
  Receipt,
  ShieldAlert,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { useDashboardCommandCenter } from '@/hooks/useDashboardCommandCenter';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUserProfile } from '@/hooks/new/useUsers';
import WeatherChip from '@/components/dashboard/WeatherChip';
import {
  ActionItem,
  ActionItemData,
  AllClear,
  DashboardTopBar,
  KpiCard,
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
  { label: 'Live Punches', icon: Clock,      href: '/admin/live-punch-monitor', tone: 'emerald' },
  { label: 'Payroll',      icon: Receipt,    href: '/admin/payroll-summary',    tone: 'blue' },
  { label: 'Daily Reports',icon: FileText,   href: '/admin/daily-reports',      tone: 'purple' },
  { label: 'Jobsites',     icon: MapPin,     href: '/admin/jobsites',           tone: 'orange' },
  { label: 'Invoices',     icon: TrendingUp, href: '/admin/invoices',           tone: 'emerald' },
  { label: 'Job Costing',  icon: Receipt,    href: '/admin/job-costing',        tone: 'blue' },
];

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ setActiveTab }) => {
  const { data: cc, isLoading } = useDashboardCommandCenter();
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const navigate = useNavigate();

  const totalActionCount =
    (cc?.pendingTimesheets ?? 0) +
    (cc?.pendingMaterialRequests ?? 0) +
    (cc?.overdueInvoices ?? 0) +
    (cc?.pendingAttentionReports ?? 0) +
    (cc?.pendingTimeRequests ?? 0);

  const totalAlertCount = cc?.certsExpiringIn30Days ?? 0;

  // Prioritised: urgent (money / safety) first, routine approvals after.
  const actionItems: ActionItemData[] = [
    {
      icon: Receipt,
      label: `Overdue invoices${cc?.overdueInvoicesAmount ? ` · ${fmt.format(cc.overdueInvoicesAmount)}` : ''}`,
      count: cc?.overdueInvoices ?? 0,
      href: '/admin/invoices',
      tone: 'urgent',
    },
    { icon: AlertTriangle, label: 'Attention reports',    count: cc?.pendingAttentionReports ?? 0, href: '/admin/attention-reports', tone: 'urgent' },
    { icon: Clock,         label: 'Timesheets to approve', count: cc?.pendingTimesheets ?? 0,       href: '/admin/timesheets',        tone: 'normal' },
    { icon: FileText,      label: 'Material requests',     count: cc?.pendingMaterialRequests ?? 0, href: '/admin/material-requests', tone: 'normal' },
    { icon: Clock,         label: 'Time requests',         count: cc?.pendingTimeRequests ?? 0,     href: '/admin/time-requests',     tone: 'normal' },
  ];

  const overdueValue = cc?.overdueInvoicesAmount
    ? fmt.format(cc.overdueInvoicesAmount)
    : `${cc?.overdueInvoices ?? 0}`;

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">

      {/* Top bar */}
      <DashboardTopBar
        firstName={userProfile?.first_name ?? user?.firstName}
        lastName={userProfile?.last_name ?? user?.lastName}
        photoUrl={userProfile?.photo_url}
        roleLabel={user?.role?.replace('_', ' ') || 'Admin'}
        companyName={user?.companyName}
        accent="orange"
        onViewProfile={() => navigate('/admin/settings')}
        rightSlot={<WeatherChip />}
      />

      <LicenseWarningBanner />
      <EmployeeLimitCard />

      {/* KPI band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard loading={isLoading} icon={HardHat} tone="emerald" pulse value={cc?.workersOnClockNow ?? 0} label="On clock now" />
        <KpiCard loading={isLoading} icon={MapPin}  tone="blue"    value={cc?.activeSiteCount ?? 0}   label="Active sites" />
        <KpiCard loading={isLoading} icon={Timer}   tone="purple"  value={`${cc?.totalHoursToday ?? 0}h`} label="Hours logged today" />
        <KpiCard
          loading={isLoading}
          icon={Receipt}
          tone="red"
          value={overdueValue}
          label="Overdue invoices"
          sublabel={cc?.overdueInvoices ? `${cc.overdueInvoices} invoice${cc.overdueInvoices !== 1 ? 's' : ''}` : 'None overdue'}
          onClick={() => navigate('/admin/invoices')}
        />
      </div>

      {/* Command center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Needs Attention — the hero */}
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

        {/* Right rail: alerts + quick jump */}
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

      {/* Quick jump */}
      <SectionCard title="Quick Jump" icon={TrendingUp} iconTone="slate">
        <QuickActions items={QUICK_ACTIONS} cols={3} />
      </SectionCard>

      {/* Live activity */}
      <LiveActiveEmployees />
    </div>
  );
};

export default AdminDashboardContent;

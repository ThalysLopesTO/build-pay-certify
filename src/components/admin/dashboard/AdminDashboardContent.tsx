import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  DollarSign,
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
import { useInvoices } from '@/hooks/useInvoices';
import { useInvoiceAnalytics } from '@/hooks/useInvoiceAnalytics';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUserProfile } from '@/hooks/new/useUsers';
import DashboardHeroBand from '@/components/dashboard/DashboardHeroBand';
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

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = () => {
  const { data: cc, isLoading } = useDashboardCommandCenter();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { monthlyData } = useInvoiceAnalytics(invoices);
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const navigate = useNavigate();

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

      {/* Hero band + stat cards */}
      <DashboardHeroBand
        firstName={userProfile?.first_name ?? user?.firstName}
        lastName={userProfile?.last_name ?? user?.lastName}
        photoUrl={userProfile?.photo_url}
        roleLabel={user?.role?.replace('_', ' ') || 'Admin'}
        companyName={user?.companyName}
        accent="orange"
        onViewProfile={() => navigate('/admin/settings')}
      >
        <StatCard loading={invoicesLoading} label="Invoiced this month" value={fmt.format(issuedThisMonth)} icon={FileText} accent="orange" delta={issuedDelta} sublabel="No prior month data" />
        <StatCard loading={invoicesLoading} label="Collected this month" value={fmt.format(paidThisMonth)} icon={DollarSign} accent="emerald" delta={paidDelta} sublabel="No prior month data" />
        <StatCard loading={isLoading} label="On clock now" value={cc?.workersOnClockNow ?? 0} icon={HardHat} accent="blue" pulse sublabel="Live on site" />
        <StatCard loading={isLoading} label="Hours logged today" value={`${cc?.totalHoursToday ?? 0}h`} icon={Timer} accent="purple" sublabel="Across all sites" />
      </DashboardHeroBand>

      <LicenseWarningBanner />
      <EmployeeLimitCard />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueOverviewChart data={monthlyData} loading={invoicesLoading} />
        </div>
        <div className="lg:col-span-1">
          <CollectionsBarChart data={monthlyData} loading={invoicesLoading} />
        </div>
      </div>

      {/* Command center */}
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

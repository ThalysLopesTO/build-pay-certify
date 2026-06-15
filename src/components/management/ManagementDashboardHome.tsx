import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Clock,
  DollarSign,
  FileText,
  Inbox,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { useManagementDashboardStats } from '@/hooks/useManagementDashboardStats';
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

interface ManagementDashboardHomeProps {
  setActiveTab: (tab: string) => void;
}

const fmt = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'My Timesheet',   icon: Clock,      href: '/management/my-timesheet',       tone: 'blue' },
  { label: 'Live Punches',   icon: Clock,      href: '/management/live-punch-monitor', tone: 'emerald' },
  { label: 'Bills',          icon: Receipt,    href: '/management/bills-expenses',     tone: 'orange' },
  { label: 'Reports',        icon: BarChart3,  href: '/management/reports',            tone: 'purple' },
  { label: 'Payroll',        icon: DollarSign, href: '/management/payroll-summary',    tone: 'emerald' },
  { label: 'Invoices',       icon: TrendingUp, href: '/management/invoices',           tone: 'blue' },
];

const ManagementDashboardHome: React.FC<ManagementDashboardHomeProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useManagementDashboardStats();
  const { data: userProfile } = useUserProfile();
  const navigate = useNavigate();

  const totalTimesheets = stats?.totalTimesheetsCount ?? 0;
  const approvedTimesheets = stats?.approvedTimesheetsCount ?? 0;
  const approvalProgress = totalTimesheets > 0 ? Math.round((approvedTimesheets / totalTimesheets) * 100) : 0;

  const actionItems: ActionItemData[] = [
    { icon: Receipt,  label: 'Unpaid bills',          count: stats?.pendingBillsCount ?? 0,     href: '/management/bills-expenses', tone: 'urgent' },
    { icon: FileText, label: 'Open attention reports', count: stats?.openReportsCount ?? 0,      href: '/management/reports',        tone: 'warning' },
    { icon: Clock,    label: 'Timesheets to approve',  count: stats?.pendingTimesheetsCount ?? 0, href: '/management/timesheets',     tone: 'normal' },
  ];

  const totalActionCount =
    (stats?.pendingBillsCount ?? 0) + (stats?.openReportsCount ?? 0) + (stats?.pendingTimesheetsCount ?? 0);

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">

      {/* Top bar */}
      <DashboardTopBar
        firstName={userProfile?.first_name ?? user?.firstName}
        lastName={userProfile?.last_name ?? user?.lastName}
        photoUrl={userProfile?.photo_url}
        roleLabel="Operations Manager"
        companyName={user?.companyName}
        accent="orange"
        onViewProfile={() => navigate('/management/settings')}
        rightSlot={<WeatherChip />}
      />

      {/* KPI band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          loading={isLoading}
          icon={DollarSign}
          tone="emerald"
          value={fmt.format(stats?.currentWeekPayroll ?? 0)}
          label="Payroll this week"
          onClick={() => navigate('/management/payroll-summary')}
        />
        <KpiCard
          loading={isLoading}
          icon={Clock}
          tone="orange"
          value={stats?.pendingTimesheetsCount ?? 0}
          label="Timesheets to approve"
          onClick={() => navigate('/management/timesheets')}
        />
        <KpiCard
          loading={isLoading}
          icon={Receipt}
          tone="red"
          value={stats?.pendingBillsCount ?? 0}
          label="Unpaid bills"
          onClick={() => navigate('/management/bills-expenses')}
        />
        <KpiCard
          loading={isLoading}
          icon={TrendingUp}
          tone="blue"
          value={`${approvalProgress}%`}
          label="Approved this week"
          sublabel={`${approvedTimesheets}/${totalTimesheets} timesheets`}
        />
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
              {Array.from({ length: 3 }).map((_, i) => (
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
          <SectionCard title="Quick Jump" icon={TrendingUp} iconTone="slate">
            <QuickActions items={QUICK_ACTIONS} cols={2} />
          </SectionCard>
          <BirthdayWidget variant="orange" />
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboardHome;

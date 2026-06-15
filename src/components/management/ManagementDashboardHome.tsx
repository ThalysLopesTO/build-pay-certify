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

interface ManagementDashboardHomeProps {
  setActiveTab: (tab: string) => void;
}

const fmt = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'My Timesheet', icon: Clock,      href: '/management/my-timesheet',       tone: 'blue' },
  { label: 'Live Punches', icon: Clock,      href: '/management/live-punch-monitor', tone: 'emerald' },
  { label: 'Bills',        icon: Receipt,    href: '/management/bills-expenses',     tone: 'orange' },
  { label: 'Reports',      icon: BarChart3,  href: '/management/reports',            tone: 'purple' },
  { label: 'Payroll',      icon: DollarSign, href: '/management/payroll-summary',    tone: 'emerald' },
  { label: 'Invoices',     icon: TrendingUp, href: '/management/invoices',           tone: 'blue' },
];

const pctChange = (cur: number, prev: number): number | null =>
  prev > 0 ? ((cur - prev) / prev) * 100 : null;

const ManagementDashboardHome: React.FC<ManagementDashboardHomeProps> = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useManagementDashboardStats();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { monthlyData } = useInvoiceAnalytics(invoices);
  const { data: userProfile } = useUserProfile();
  const navigate = useNavigate();

  const last = monthlyData[monthlyData.length - 1];
  const prev = monthlyData[monthlyData.length - 2];
  const paidThisMonth = last?.paid ?? 0;
  const paidDelta = pctChange(paidThisMonth, prev?.paid ?? 0);

  const actionItems: ActionItemData[] = [
    { icon: Receipt,  label: 'Unpaid bills',          count: stats?.pendingBillsCount ?? 0,      href: '/management/bills-expenses', tone: 'urgent' },
    { icon: FileText, label: 'Open attention reports', count: stats?.openReportsCount ?? 0,       href: '/management/reports',        tone: 'warning' },
    { icon: Clock,    label: 'Timesheets to approve',  count: stats?.pendingTimesheetsCount ?? 0, href: '/management/timesheets',     tone: 'normal' },
  ];

  const totalActionCount =
    (stats?.pendingBillsCount ?? 0) + (stats?.openReportsCount ?? 0) + (stats?.pendingTimesheetsCount ?? 0);

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">

      {/* Hero band + stat cards */}
      <DashboardHeroBand
        firstName={userProfile?.first_name ?? user?.firstName}
        lastName={userProfile?.last_name ?? user?.lastName}
        photoUrl={userProfile?.photo_url}
        roleLabel="Operations Manager"
        companyName={user?.companyName}
        accent="orange"
        onViewProfile={() => navigate('/management/settings')}
      >
        <StatCard loading={invoicesLoading} label="Collected this month" value={fmt.format(paidThisMonth)} icon={DollarSign} accent="emerald" delta={paidDelta} sublabel="No prior month data" />
        <StatCard loading={isLoading} label="Payroll this week" value={fmt.format(stats?.currentWeekPayroll ?? 0)} icon={Receipt} accent="blue" onClick={() => navigate('/management/payroll-summary')} sublabel="Approved timesheets" />
        <StatCard loading={isLoading} label="Timesheets to approve" value={stats?.pendingTimesheetsCount ?? 0} icon={Clock} accent="orange" onClick={() => navigate('/management/timesheets')} sublabel="Awaiting review" />
        <StatCard loading={isLoading} label="Unpaid bills" value={stats?.pendingBillsCount ?? 0} icon={FileText} accent="red" onClick={() => navigate('/management/bills-expenses')} sublabel="Outstanding" />
      </DashboardHeroBand>

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

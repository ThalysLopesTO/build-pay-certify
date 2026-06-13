import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  HardHat,
  Inbox,
  MapPin,
  Receipt,
  ShieldAlert,
  Timer,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useDashboardCommandCenter } from '@/hooks/useDashboardCommandCenter';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUserProfile } from '@/hooks/new/useUsers';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import WeatherCard from './WeatherCard';
import BirthdayWidget from '@/components/common/BirthdayWidget';
import LicenseWarningBanner from '../../common/LicenseWarningBanner';
import EmployeeLimitCard from './EmployeeLimitCard';
import LiveActiveEmployees from './LiveActiveEmployees';

interface AdminDashboardContentProps {
  setActiveTab: (tab: string) => void;
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// ─── tiny reusable building blocks ───────────────────────────────────────────

const ActionRow = ({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  count,
  href,
  urgent,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  count: number;
  href: string;
  urgent?: boolean;
}) => {
  const navigate = useNavigate();
  if (count === 0) return null;
  return (
    <button
      onClick={() => navigate(href)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group text-left"
    >
      <div className={`p-2 rounded-lg ${iconBg} flex-shrink-0`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <span className="flex-1 text-sm font-medium text-slate-700 truncate">{label}</span>
      <Badge
        className={`ml-auto flex-shrink-0 font-semibold ${
          urgent
            ? 'bg-red-100 text-red-700 border-red-200'
            : 'bg-orange-100 text-orange-700 border-orange-200'
        }`}
        variant="outline"
      >
        {count}
      </Badge>
      <ArrowRight className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
};

const StatPill = ({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
}) => (
  <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
    <div className={`p-2 rounded-lg ${iconBg}`}>
      <Icon className={`h-5 w-5 ${iconColor}`} />
    </div>
    <div>
      <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  </div>
);

const AlertRow = ({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  count,
  href,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  count: number;
  href: string;
}) => {
  const navigate = useNavigate();
  if (count === 0) return null;
  return (
    <button
      onClick={() => navigate(href)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group text-left"
    >
      <div className={`p-2 rounded-lg ${iconBg} flex-shrink-0`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <span className="flex-1 text-sm font-medium text-slate-700 truncate">{label}</span>
      <Badge className="ml-auto flex-shrink-0 bg-amber-100 text-amber-700 border-amber-200 font-semibold" variant="outline">
        {count}
      </Badge>
      <ArrowRight className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ setActiveTab }) => {
  const { data: cc, isLoading } = useDashboardCommandCenter();
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const navigate = useNavigate();

  const firstName = userProfile?.first_name || user?.firstName || 'Admin';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const totalActionCount =
    (cc?.pendingTimesheets ?? 0) +
    (cc?.pendingMaterialRequests ?? 0) +
    (cc?.overdueInvoices ?? 0) +
    (cc?.pendingAttentionReports ?? 0) +
    (cc?.pendingTimeRequests ?? 0);

  const totalAlertCount =
    (cc?.certsExpiringIn30Days ?? 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">

      {/* ── Hero row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-stretch">
        <Card className="lg:col-span-2 shadow-sm border-0 bg-gradient-to-br from-white to-orange-50 rounded-2xl">
          <CardContent className="p-6 h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 h-full">
              <EmployeeAvatar
                photoUrl={userProfile?.photo_url ?? undefined}
                firstName={userProfile?.first_name ?? user?.firstName ?? undefined}
                lastName={userProfile?.last_name ?? user?.lastName ?? undefined}
                size="lg"
                className="shadow-lg flex-shrink-0"
              />
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Welcome back, {firstName} 👋
                </h1>
                <p className="text-slate-500 text-sm">{today}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                    <span className="w-2 h-2 rounded-full mr-2 animate-pulse bg-orange-500 inline-block" />
                    {user?.role || 'Admin'}
                  </Badge>
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <Building className="h-3.5 w-3.5" />
                    {user?.companyName || 'StackBuild'}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-fit" onClick={() => navigate('/admin/settings')}>
                  <Eye className="h-4 w-4 mr-2" /> View Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <WeatherCard />
          <BirthdayWidget variant="orange" />
        </div>
      </div>

      <LicenseWarningBanner />
      <EmployeeLimitCard />

      {/* ── Live stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))
        ) : (
          <>
            <StatPill
              icon={HardHat}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              value={cc?.workersOnClockNow ?? 0}
              label="On clock now"
            />
            <StatPill
              icon={MapPin}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              value={cc?.activeSiteCount ?? 0}
              label="Active sites"
            />
            <StatPill
              icon={Timer}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              value={`${cc?.totalHoursToday ?? 0}h`}
              label="Hours today"
            />
            <StatPill
              icon={TrendingUp}
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              value={totalActionCount}
              label="Items need action"
            />
          </>
        )}
      </div>

      {/* ── Command center grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Needs Action */}
        <Card className="rounded-2xl shadow-sm border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <Inbox className="h-4 w-4 text-red-600" />
              </div>
              Needs Action
              {totalActionCount > 0 && (
                <Badge className="ml-auto bg-red-500 text-white text-xs">{totalActionCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 space-y-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)
            ) : totalActionCount === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-sm font-medium text-slate-500">All clear — nothing pending</p>
              </div>
            ) : (
              <>
                <ActionRow
                  icon={Clock}
                  iconBg="bg-blue-100"
                  iconColor="text-blue-600"
                  label="Timesheets to approve"
                  count={cc?.pendingTimesheets ?? 0}
                  href="/admin/timesheets"
                />
                <ActionRow
                  icon={FileText}
                  iconBg="bg-orange-100"
                  iconColor="text-orange-600"
                  label="Material requests"
                  count={cc?.pendingMaterialRequests ?? 0}
                  href="/admin/material-requests"
                />
                <ActionRow
                  icon={Receipt}
                  iconBg="bg-red-100"
                  iconColor="text-red-600"
                  label={`Overdue invoices${cc?.overdueInvoicesAmount ? ` · ${fmt.format(cc.overdueInvoicesAmount)}` : ''}`}
                  count={cc?.overdueInvoices ?? 0}
                  href="/admin/invoices"
                  urgent
                />
                <ActionRow
                  icon={AlertTriangle}
                  iconBg="bg-amber-100"
                  iconColor="text-amber-600"
                  label="Attention reports"
                  count={cc?.pendingAttentionReports ?? 0}
                  href="/admin/attention-reports"
                  urgent
                />
                <ActionRow
                  icon={Clock}
                  iconBg="bg-purple-100"
                  iconColor="text-purple-600"
                  label="Time requests"
                  count={cc?.pendingTimeRequests ?? 0}
                  href="/admin/time-requests"
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="rounded-2xl shadow-sm border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
              </div>
              Alerts
              {totalAlertCount > 0 && (
                <Badge className="ml-auto bg-amber-500 text-white text-xs">{totalAlertCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 space-y-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)
            ) : totalAlertCount === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-sm font-medium text-slate-500">No alerts right now</p>
              </div>
            ) : (
              <>
                {(cc?.certsExpiringIn7Days ?? 0) > 0 && (
                  <AlertRow
                    icon={ShieldAlert}
                    iconBg="bg-red-100"
                    iconColor="text-red-600"
                    label="Certs expiring within 7 days"
                    count={cc!.certsExpiringIn7Days}
                    href="/admin/employees"
                  />
                )}
                {(cc?.certsExpiringIn30Days ?? 0) > (cc?.certsExpiringIn7Days ?? 0) && (
                  <AlertRow
                    icon={ShieldAlert}
                    iconBg="bg-amber-100"
                    iconColor="text-amber-600"
                    label="Certs expiring within 30 days"
                    count={(cc?.certsExpiringIn30Days ?? 0) - (cc?.certsExpiringIn7Days ?? 0)}
                    href="/admin/employees"
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Jump */}
        <Card className="rounded-2xl shadow-sm border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Users className="h-4 w-4 text-slate-600" />
              </div>
              Quick Jump
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Live Punches', icon: Clock, href: '/admin/live-punch-monitor', bg: 'bg-emerald-50 hover:bg-emerald-100', color: 'text-emerald-700' },
                { label: 'Payroll', icon: Receipt, href: '/admin/payroll-summary', bg: 'bg-blue-50 hover:bg-blue-100', color: 'text-blue-700' },
                { label: 'Daily Reports', icon: FileText, href: '/admin/daily-reports', bg: 'bg-purple-50 hover:bg-purple-100', color: 'text-purple-700' },
                { label: 'Jobsites', icon: MapPin, href: '/admin/jobsites', bg: 'bg-orange-50 hover:bg-orange-100', color: 'text-orange-700' },
                { label: 'Invoices', icon: TrendingUp, href: '/admin/invoices', bg: 'bg-pink-50 hover:bg-pink-100', color: 'text-pink-700' },
                { label: 'Job Costing', icon: Receipt, href: '/admin/job-costing', bg: 'bg-emerald-50 hover:bg-emerald-100', color: 'text-emerald-700' },
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors text-center ${item.bg}`}
                >
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <span className={`text-xs font-medium ${item.color}`}>{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Daily activity feed ── */}
      <LiveActiveEmployees />
    </div>
  );
};

export default AdminDashboardContent;

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  HardHat,
  MapPin,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useJobCosting, type JobsitePnL } from '@/hooks/useJobCosting';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const fmt = (n: number) => currency.format(n);

// ── helpers ───────────────────────────────────────────────────────────────────

const marginColor = (pct: number | null) => {
  if (pct === null) return 'bg-slate-100 text-slate-500';
  if (pct >= 30) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (pct >= 15) return 'bg-green-100 text-green-700 border-green-200';
  if (pct >= 5) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (pct >= 0) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

const statusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Active</Badge>;
    case 'completed':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Completed</Badge>;
    case 'on_hold':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">On Hold</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
};

// ── KPI strip ─────────────────────────────────────────────────────────────────

const KpiCard = ({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
}) => (
  <Card className="rounded-2xl shadow-sm border border-slate-100">
    <CardContent className="p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${iconBg} flex-shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

// ── project card ──────────────────────────────────────────────────────────────

const ProjectCard = ({ job, onDetails }: { job: JobsitePnL; onDetails: () => void }) => {
  const hasActivity = job.invoicedTotal > 0 || job.laborCost > 0;

  return (
    <Card className="rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 truncate leading-tight">{job.jobsiteName}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {statusBadge(job.status)}
              {job.dueDate && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due {new Date(job.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          {job.marginPct !== null ? (
            <Badge
              variant="outline"
              className={`flex-shrink-0 font-bold text-base px-3 py-1 rounded-xl ${marginColor(job.marginPct)}`}
            >
              {job.marginPct >= 0 ? '+' : ''}{job.marginPct}%
            </Badge>
          ) : (
            <Badge variant="outline" className="flex-shrink-0 text-slate-400 text-xs px-3 py-1">
              No invoices
            </Badge>
          )}
        </div>

        {/* financials grid */}
        {hasActivity ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-500 font-medium mb-0.5">Invoiced</p>
              <p className="text-sm font-bold text-blue-900">{fmt(job.invoicedTotal)}</p>
              {job.paidTotal > 0 && job.paidTotal < job.invoicedTotal && (
                <p className="text-xs text-blue-400">{fmt(job.paidTotal)} paid</p>
              )}
              {job.paidTotal >= job.invoicedTotal && job.invoicedTotal > 0 && (
                <p className="text-xs text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Paid in full
                </p>
              )}
            </div>

            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-orange-500 font-medium mb-0.5">Labor Cost</p>
              <p className="text-sm font-bold text-orange-900">{fmt(job.laborCost)}</p>
              <p className="text-xs text-orange-400">{job.laborHours}h worked</p>
            </div>

            <div className={`rounded-xl p-3 col-span-2 sm:col-span-1 ${job.grossProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className={`text-xs font-medium mb-0.5 ${job.grossProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                Gross Profit
              </p>
              <p className={`text-sm font-bold flex items-center gap-1 ${job.grossProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                {job.grossProfit >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {fmt(job.grossProfit)}
              </p>
              {job.changeOrderTotal > 0 && (
                <p className="text-xs text-slate-400">{fmt(job.changeOrderTotal)} in COs</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-3 mb-4 text-slate-400">
            <Building2 className="h-4 w-4" />
            <span className="text-sm">No financial activity yet</span>
          </div>
        )}

        {/* footer */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl"
          onClick={onDetails}
        >
          View Jobsite <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

// ── main page ──────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'completed' | 'on_hold';
type SortKey = 'invoiced' | 'labor' | 'margin' | 'name';

const JobCostingPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useJobCosting();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('invoiced');

  const filtered = useMemo(() => {
    if (!data) return [];
    let jobs = statusFilter === 'all' ? data.jobs : data.jobs.filter((j) => j.status === statusFilter);
    return [...jobs].sort((a, b) => {
      switch (sortKey) {
        case 'invoiced': return b.invoicedTotal - a.invoicedTotal;
        case 'labor':    return b.laborCost - a.laborCost;
        case 'margin':   return (b.marginPct ?? -999) - (a.marginPct ?? -999);
        case 'name':     return a.jobsiteName.localeCompare(b.jobsiteName);
        default:         return 0;
      }
    });
  }, [data, statusFilter, sortKey]);

  const overallMargin =
    data && data.totalInvoiced > 0
      ? Math.round(((data.totalGrossProfit / data.totalInvoiced) * 1000)) / 10
      : null;

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All Jobs' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'on_hold', label: 'On Hold' },
  ];

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'invoiced', label: 'Invoiced ↓' },
    { key: 'margin',   label: 'Margin ↓' },
    { key: 'labor',    label: 'Labor Cost ↓' },
    { key: 'name',     label: 'Name A–Z' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Costing / P&amp;L</h1>
          <p className="text-slate-500 text-sm mt-1">Per-project profitability — labor costs vs. invoiced revenue</p>
        </div>
      </div>

      {/* ── Missing rates warning ── */}
      {data?.missingRates && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Some employees don't have hourly rates configured — their labor hours won't count toward costs.{' '}
            <button
              className="underline font-medium"
              onClick={() => navigate('/admin/employees')}
            >
              Review employees
            </button>
          </p>
        </div>
      )}

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <KpiCard
              icon={DollarSign}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              label="Total Invoiced"
              value={fmt(data?.totalInvoiced ?? 0)}
              sub={`${fmt(data?.totalPaid ?? 0)} collected`}
            />
            <KpiCard
              icon={HardHat}
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              label="Total Labor Cost"
              value={fmt(data?.totalLaborCost ?? 0)}
              sub={`${data?.totalLaborHours ?? 0}h across all projects`}
            />
            <KpiCard
              icon={TrendingUp}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              label="Total Gross Profit"
              value={fmt(data?.totalGrossProfit ?? 0)}
              sub={overallMargin !== null ? `${overallMargin}% portfolio margin` : 'No invoices yet'}
            />
            <KpiCard
              icon={MapPin}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              label="Active Projects"
              value={String(data?.jobs.filter((j) => j.status === 'active').length ?? 0)}
              sub={`${data?.jobs.length ?? 0} total tracked`}
            />
          </>
        )}
      </div>

      {/* ── Filter + sort bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sortKey === opt.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Project cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border border-slate-100">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <Building2 className="h-10 w-10" />
            <p className="text-base font-medium text-slate-500">No projects found</p>
            <p className="text-sm">
              {statusFilter !== 'all'
                ? 'Try switching to "All Jobs"'
                : 'Create a jobsite to start tracking profitability'}
            </p>
            {statusFilter !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>
                Show all jobs
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <ProjectCard
              key={job.jobsiteId}
              job={job}
              onDetails={() => navigate('/admin/jobsites')}
            />
          ))}
        </div>
      )}

      {/* ── Footer note ── */}
      {!isLoading && (data?.jobs.length ?? 0) > 0 && (
        <p className="text-xs text-slate-400 text-center pb-2">
          Margin = (Invoiced − Labor Cost) ÷ Invoiced · Labor uses each employee's configured hourly rate ·
          Approved change orders shown for reference
        </p>
      )}
    </div>
  );
};

export default JobCostingPage;

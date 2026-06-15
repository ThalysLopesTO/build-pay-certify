import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, FileText, MapPin, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUserProfile } from '@/hooks/new/useUsers';
import { useJobsites } from '@/hooks/useJobsites';
import WeatherChip from '@/components/dashboard/WeatherChip';
import {
  DashboardTopBar,
  KpiCard,
  QuickAction,
  QuickActions,
  SectionCard,
} from '@/components/dashboard/primitives';
import { DashboardCard } from '@/components/common/DashboardCard';
import BirthdayWidget from '@/components/common/BirthdayWidget';
import TodayPunchesCard from './TodayPunchesCard';
import ForemanJobProgressCard from './ForemanJobProgressCard';

interface TimesheetSummary {
  pending: number;
  approved: number;
  total: number;
}

interface MaterialRequest {
  id: string;
  material_list: string;
  delivery_date: string;
  status: string;
  jobsite_name?: string;
  created_at: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Live Punches',  icon: Clock,    href: '/foreman/live-punch-monitor', tone: 'emerald' },
  { label: 'New Request',   icon: Package,  href: '/foreman/material-request',   tone: 'blue' },
  { label: 'Timesheet',     icon: FileText, href: '/foreman/timesheet',          tone: 'purple' },
  { label: 'Daily Tasks',   icon: Clock,    href: '/foreman/daily-tasks',        tone: 'orange' },
  { label: 'Projects',      icon: MapPin,   href: '/foreman/jobsite-progress',   tone: 'emerald' },
  { label: 'My Requests',   icon: Package,  href: '/foreman/my-requests',        tone: 'blue' },
];

const ForemanDashboardHome = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfile();
  const { data: jobsites = [] } = useJobsites('active');

  const { data: timesheetSummary, isLoading: timesheetLoading } = useQuery<TimesheetSummary>({
    queryKey: ['timesheet-summary', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');

      const { data, error } = await supabase
        .from('weekly_timesheets')
        .select('status')
        .eq('company_id', user.companyId);

      if (error) throw error;

      const pending = data?.filter(t => t.status === 'pending').length || 0;
      const approved = data?.filter(t => t.status === 'approved').length || 0;

      return { pending, approved, total: data?.length || 0 };
    },
    enabled: !!user?.companyId,
  });

  const { data: recentRequests = [], isLoading: requestsLoading } = useQuery<MaterialRequest[]>({
    queryKey: ['recent-material-requests', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');

      const { data, error } = await supabase
        .from('material_requests')
        .select(`
          id,
          material_list,
          delivery_date,
          status,
          created_at,
          jobsites(name)
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      return (data || []).map((request: any) => ({
        ...request,
        jobsite_name: Array.isArray(request.jobsites)
          ? (request.jobsites[0]?.name || 'Unknown Site')
          : (request.jobsites?.name || 'Unknown Site'),
      }));
    },
    enabled: !!user?.companyId,
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">

      {/* Top bar */}
      <DashboardTopBar
        firstName={userProfile?.first_name ?? user?.firstName}
        lastName={userProfile?.last_name ?? user?.lastName}
        photoUrl={userProfile?.photo_url}
        roleLabel="Foreman"
        companyName={user?.companyName}
        accent="emerald"
        onViewProfile={() => navigate('/foreman/settings')}
        rightSlot={<WeatherChip />}
      />

      {/* KPI band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={MapPin}
          tone="blue"
          value={jobsites.length}
          label="Active jobsites"
          onClick={() => navigate('/foreman/jobsite-progress')}
        />
        <KpiCard
          loading={timesheetLoading}
          icon={Clock}
          tone="orange"
          value={timesheetSummary?.pending ?? 0}
          label="Pending timesheets"
          onClick={() => navigate('/foreman/timesheet')}
        />
        <KpiCard
          loading={timesheetLoading}
          icon={CheckCircle2}
          tone="emerald"
          value={timesheetSummary?.approved ?? 0}
          label="Approved this week"
        />
        <KpiCard
          loading={timesheetLoading}
          icon={FileText}
          tone="purple"
          value={timesheetSummary?.total ?? 0}
          label="Total timesheets"
        />
      </div>

      {/* Quick actions + birthday */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Quick Actions" icon={Clock} iconTone="emerald" className="lg:col-span-2">
          <QuickActions items={QUICK_ACTIONS} cols={3} />
        </SectionCard>
        <BirthdayWidget variant="green" />
      </div>

      {/* Crew + jobsite progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodayPunchesCard setActiveTab={setActiveTab} />
        <ForemanJobProgressCard onViewProjects={() => setActiveTab('jobsite-progress')} />
      </div>

      {/* Timesheets + material requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardCard
          title="Weekly Timesheet Summary"
          icon={<Clock className="h-5 w-5" />}
          accent="green"
          footer={
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 hover:bg-primary/5" onClick={() => setActiveTab('timesheet')}>
                Submit New
              </Button>
              <Button variant="outline" className="flex-1 hover:bg-primary/5" onClick={() => setActiveTab('employee-reports')}>
                View Reports
              </Button>
            </div>
          }
        >
          {timesheetLoading ? (
            <div className="grid grid-cols-3 gap-4 animate-pulse">
              <div className="h-20 rounded-lg bg-muted/50" />
              <div className="h-20 rounded-lg bg-muted/50" />
              <div className="h-20 rounded-lg bg-muted/50" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 mb-1">{timesheetSummary?.pending || 0}</div>
                <div className="text-sm text-muted-foreground font-medium">Pending</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-emerald-600 mb-1">{timesheetSummary?.approved || 0}</div>
                <div className="text-sm text-muted-foreground font-medium">Approved</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">{timesheetSummary?.total || 0}</div>
                <div className="text-sm text-muted-foreground font-medium">Total</div>
              </div>
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="Recent Material Requests"
          icon={<Package className="h-5 w-5" />}
          accent="green"
          footer={
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 hover:bg-primary/5" onClick={() => setActiveTab('material-request')}>
                New Request
              </Button>
              <Button variant="outline" className="flex-1 hover:bg-primary/5" onClick={() => setActiveTab('my-requests')}>
                View All
              </Button>
            </div>
          }
        >
          {requestsLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-16 rounded-lg bg-muted/50" />
              <div className="h-16 rounded-lg bg-muted/50" />
              <div className="h-16 rounded-lg bg-muted/50" />
            </div>
          ) : recentRequests.length > 0 ? (
            <div className="space-y-3">
              {recentRequests.map((request) => {
                const createdDate = new Date(request.created_at);
                const dayOfWeek = createdDate.toLocaleDateString('en-US', { weekday: 'short' });
                const dateFormatted = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div key={request.id} className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-emerald-100 rounded-full border border-emerald-200">
                      <div className="text-xs font-semibold text-emerald-700 leading-none">{dayOfWeek}</div>
                      <div className="text-xs text-emerald-600 leading-none mt-0.5">{dateFormatted.split(' ')[1]}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm mb-1 truncate">{request.jobsite_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Delivery: {new Date(request.delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <Badge
                      variant={request.status === 'delivered' ? 'default' : request.status === 'ordered' ? 'secondary' : 'outline'}
                      className={`text-xs font-medium shrink-0 ${
                        request.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        request.status === 'ordered' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}
                    >
                      {request.status === 'pending' ? 'Pending' : request.status === 'ordered' ? 'Ordered' : 'Delivered'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No recent requests</p>
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
};

export default ForemanDashboardHome;

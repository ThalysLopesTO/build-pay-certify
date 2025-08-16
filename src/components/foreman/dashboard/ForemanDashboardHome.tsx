import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Building, Package, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardHero from '@/components/dashboard/DashboardHero';
import WeeklyOverviewCard from '@/components/dashboard/WeeklyOverviewCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useJobsites } from '@/hooks/useJobsites';
import TodayPunchesCard from './TodayPunchesCard';
import ForemanJobProgressCard from './ForemanJobProgressCard';
import { DashboardCard } from '@/components/common/DashboardCard';
import WeatherCard from '../../admin/dashboard/WeatherCard';


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

const ForemanDashboardHome = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const { user } = useAuth();
  const { data: jobsites = [] } = useJobsites('active');

  // Get current date formatted nicely
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Fetch user profile for avatar and name
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, photo_url')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });


  // Fetch timesheet summary
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

      return {
        pending,
        approved,
        total: data?.length || 0
      };
    },
    enabled: !!user?.companyId,
  });

  // Fetch recent material requests
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
          : (request.jobsites?.name || 'Unknown Site')
      }));
    },
    enabled: !!user?.companyId,
  });


  const userName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'Foreman';
  const userInitials = userProfile ? `${userProfile.first_name?.[0] || ''}${userProfile.last_name?.[0] || ''}` : 'F';

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-fade-in">
{/* Hero + Overview row */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
  <div className="lg:col-span-2 h-full flex flex-col">
    <DashboardHero
      theme="green"
      firstName={userProfile?.first_name || user?.firstName}
      lastName={userProfile?.last_name || user?.lastName}
      photoUrl={userProfile?.photo_url}
      companyName={user?.companyName}
      trade={user?.trade}
      onViewProfile={() => setActiveTab('settings')}
      statusText="Ready to Work"
    />
  </div>
  <WeatherCard variant="green" locationStrategy="jobsite-first" />
</div>

{/* Quick Actions */}
<div className="space-y-4 mt-6">
  <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[
      { title: 'Live Punch Monitor', icon: Clock, onClick: () => setActiveTab('live-punch-monitor'), color: 'bg-emerald-600 hover:bg-emerald-700', description: 'See activity' },
      { title: 'New Material Request', icon: Package, onClick: () => setActiveTab('material-request'), color: 'bg-emerald-500 hover:bg-emerald-600', description: 'Order materials' },
      { title: 'Timesheet', icon: FileText, onClick: () => setActiveTab('timesheet'), color: 'bg-emerald-700 hover:bg-emerald-800', description: 'Submit hours' },
      { title: 'Projects', icon: Building, onClick: () => setActiveTab('jobsite-progress'), color: 'bg-emerald-600 hover:bg-emerald-700', description: 'View progress' },
    ].map((action, index) => {
      const Icon = action.icon;
      return (
        <Card 
          key={index} 
          className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-0 shadow-md"
          onClick={action.onClick}
        >
          <CardContent className="p-6 text-center space-y-3">
            <div className={`mx-auto w-12 h-12 rounded-full ${action.color} flex items-center justify-center transition-colors`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">{action.title}</h3>
              <p className="text-xs text-slate-600 mt-1">{action.description}</p>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
</div>

{/* Main Dashboard Cards - First Row */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Punch Monitor Card - Enhanced */}
        <TodayPunchesCard setActiveTab={setActiveTab} />

        <ForemanJobProgressCard onViewProjects={() => setActiveTab('jobsite-progress')} />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Timesheet Summary Card */}
        <DashboardCard
          title="Weekly Timesheet Summary"
          icon={<Clock className="h-5 w-5" />}
          accent="green"
          footer={
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 hover:bg-primary/5"
                onClick={() => setActiveTab('timesheet')}
              >
                Submit New
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 hover:bg-primary/5"
                onClick={() => setActiveTab('employee-reports')}
              >
                View Reports
              </Button>
            </div>
          }
        >
          {timesheetLoading ? (
            <div className="grid grid-cols-3 gap-6 animate-pulse">
              <div className="h-20 rounded-lg bg-muted/50" />
              <div className="h-20 rounded-lg bg-muted/50" />
              <div className="h-20 rounded-lg bg-muted/50" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 mb-1" aria-label={`Pending timesheets: ${timesheetSummary?.pending || 0}`}>
                  {timesheetSummary?.pending || 0}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Pending</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1" aria-label={`Approved timesheets: ${timesheetSummary?.approved || 0}`}>
                  {timesheetSummary?.approved || 0}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Approved</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1" aria-label={`Total timesheets: ${timesheetSummary?.total || 0}`}>
                  {timesheetSummary?.total || 0}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Total</div>
              </div>
            </div>
          )}
        </DashboardCard>

        {/* Material Requests Overview */}
        <DashboardCard
          title="Recent Material Requests"
          icon={<Package className="h-5 w-5" />}
          accent="green"
          footer={
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 hover:bg-primary/5"
                onClick={() => setActiveTab('material-request')}
              >
                New Request
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 hover:bg-primary/5"
                onClick={() => setActiveTab('my-requests')}
              >
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
                    {/* Date Circle */}
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-emerald-100 rounded-full border border-emerald-200">
                      <div className="text-xs font-semibold text-emerald-700 leading-none">{dayOfWeek}</div>
                      <div className="text-xs text-emerald-600 leading-none mt-0.5">{dateFormatted.split(' ')[1]}</div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm mb-1 truncate">
                        {request.jobsite_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Delivery: {new Date(request.delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <Badge 
                      variant={
                        request.status === 'delivered' ? 'default' :
                        request.status === 'ordered' ? 'secondary' :
                        'outline'
                      }
                      className={`text-xs font-medium shrink-0 ${
                        request.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        request.status === 'ordered' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}
                    >
                      {request.status === 'pending' ? 'Pending' :
                       request.status === 'ordered' ? 'Ordered' :
                       'Delivered'}
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
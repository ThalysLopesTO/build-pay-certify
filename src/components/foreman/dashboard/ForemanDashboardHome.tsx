import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Building, ChevronRight, Package, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardHero from '@/components/dashboard/DashboardHero';
import WeeklyOverviewCard from '@/components/dashboard/WeeklyOverviewCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useJobsites } from '@/hooks/useJobsites';
import TodayPunchesCard from './TodayPunchesCard';


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
  const { data: timesheetSummary } = useQuery<TimesheetSummary>({
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
  const { data: recentRequests = [] } = useQuery<MaterialRequest[]>({
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

  // Calculate jobsite progress for the top 3 active jobsites assigned to this foreman
  const { data: foremanJobsites = [] } = useQuery({
    queryKey: ['foreman-assigned-jobsites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('jobsites')
        .select(`
          id,
          name,
          created_at,
          starting_date,
          due_date,
          jobsite_tasks(id, status)
        `)
        .eq('assigned_foreman_id', user.id)
        .eq('status', 'active')
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const jobsiteProgressData = foremanJobsites.map(jobsite => {
    const tasks = jobsite.jobsite_tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      id: jobsite.id,
      name: jobsite.name,
      progress,
      totalTasks,
      completedTasks
    };
  });

  const overallProgress = jobsiteProgressData.length > 0 
    ? Math.round(jobsiteProgressData.reduce((acc, job) => acc + job.progress, 0) / jobsiteProgressData.length)
    : 0;

  const userName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'Foreman';
  const userInitials = userProfile ? `${userProfile.first_name?.[0] || ''}${userProfile.last_name?.[0] || ''}` : 'F';

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-fade-in">
{/* Hero + Overview row */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
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
  <WeeklyOverviewCard
    pending={timesheetSummary?.pending || 0}
    approved={timesheetSummary?.approved || 0}
    total={timesheetSummary?.total || 0}
    theme="green"
  />
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

        {/* Job Progress Card */}
        <Card className="border border-border shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="h-5 w-5 text-primary" />
              </div>
              Job Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground font-semibold">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>

            {/* Top Jobsites */}
            <div className="space-y-4">
              {jobsiteProgressData.length > 0 ? (
                jobsiteProgressData.map((job) => (
                  <div key={job.id} className="space-y-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1 mr-2">{job.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {job.completedTasks}/{job.totalTasks} tasks
                        </span>
                        <span className="text-sm text-muted-foreground font-semibold">{job.progress}%</span>
                      </div>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Building className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No assigned jobsites</p>
                  <p className="text-xs">Contact your supervisor to get assigned to projects</p>
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              className="w-full hover:bg-primary/5" 
              onClick={() => setActiveTab('jobsite-progress')}
            >
              View My Projects
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Timesheet Summary Card */}
        <Card className="border border-border shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              Weekly Timesheet Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {timesheetSummary?.pending || 0}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Pending</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {timesheetSummary?.approved || 0}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Approved</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">
                  {timesheetSummary?.total || 0}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Total</div>
              </div>
            </div>
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
          </CardContent>
        </Card>

        {/* Material Requests Overview */}
        <Card className="border border-border shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              Recent Material Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex-1">
                      <div className="text-sm font-medium truncate mb-1">
                        {request.material_list.substring(0, 30)}...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {request.jobsite_name} • {new Date(request.delivery_date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge 
                      variant={request.status === 'approved' ? 'default' : request.status === 'pending' ? 'secondary' : 'destructive'}
                      className="text-xs font-medium"
                    >
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No recent requests</p>
              </div>
            )}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForemanDashboardHome;
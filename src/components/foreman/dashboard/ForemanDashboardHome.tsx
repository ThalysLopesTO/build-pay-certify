import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Building, ChevronRight, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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

      return data?.map(request => ({
        ...request,
        jobsite_name: request.jobsites?.name || 'Unknown Site'
      })) || [];
    },
    enabled: !!user?.companyId,
  });

  // Calculate jobsite progress for the top 3 active jobsites
  const jobsiteProgressData = jobsites.slice(0, 3).map(jobsite => {
    // Mock progress calculation based on creation date (you can enhance this with real task data)
    const daysSinceStart = Math.floor((new Date().getTime() - new Date(jobsite.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const progress = Math.min(daysSinceStart * 2, 100); // Mock: 2% per day, max 100%
    
    return {
      id: jobsite.id,
      name: jobsite.name,
      progress: progress
    };
  });

  const overallProgress = jobsiteProgressData.length > 0 
    ? Math.round(jobsiteProgressData.reduce((acc, job) => acc + job.progress, 0) / jobsiteProgressData.length)
    : 0;

  const userName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'Foreman';
  const userInitials = userProfile ? `${userProfile.first_name?.[0] || ''}${userProfile.last_name?.[0] || ''}` : 'F';

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Banner */}
      <Card className="border border-border shadow-lg bg-gradient-to-r from-primary/5 via-background to-primary/5 rounded-xl">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-md">
              <AvatarImage src={userProfile?.photo_url} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {userName}
              </h1>
              <p className="text-muted-foreground mb-3 text-lg">{formattedDate}</p>
              <p className="text-sm text-primary font-medium">
                Here's what's happening on your sites today
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                      <span className="text-sm text-muted-foreground font-semibold">{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Building className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No active jobsites</p>
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              className="w-full hover:bg-primary/5" 
              onClick={() => setActiveTab('jobsite-progress')}
            >
              View All Jobs
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
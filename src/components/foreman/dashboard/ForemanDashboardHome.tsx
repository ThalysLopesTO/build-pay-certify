import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Building, Activity, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useJobsites } from '@/hooks/useJobsites';
import ForemanTimesheetForm from '../ForemanTimesheetForm';

interface LivePunchData {
  totalEmployees: number;
  punchedInEmployees: number;
  isActive: boolean;
}

const ForemanDashboardHome = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const { user } = useAuth();
  const { data: jobsites = [] } = useJobsites('active');

  // Fetch live punch data
  const { data: livePunchData, isLoading: punchLoading } = useQuery<LivePunchData>({
    queryKey: ['live-punch-data', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');

      // Get all active employees for the company
      const { data: employees, error: employeeError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('company_id', user.companyId)
        .eq('is_active', true)
        .in('role', ['employee', 'foreman']);

      if (employeeError) throw employeeError;

      // Get today's punched in employees (no check_out_time)
      const today = new Date().toISOString().split('T')[0];
      const { data: punchedIn, error: punchError } = await supabase
        .from('timesheets')
        .select('user_id')
        .eq('company_id', user.companyId)
        .gte('check_in_time', `${today}T00:00:00`)
        .is('check_out_time', null);

      if (punchError) throw punchError;

      return {
        totalEmployees: employees?.length || 0,
        punchedInEmployees: punchedIn?.length || 0,
        isActive: (punchedIn?.length || 0) > 0
      };
    },
    enabled: !!user?.companyId,
    refetchInterval: 30000, // Refresh every 30 seconds
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

  return (
    <div className="space-y-6">
      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Punch Monitor Card */}
        <Card className="border border-border shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Live Punch Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {punchLoading ? '...' : `${livePunchData?.punchedInEmployees || 0}`}
                </div>
                <div className="text-sm text-muted-foreground">
                  of {livePunchData?.totalEmployees || 0} employees punched in
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${livePunchData?.isActive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <Badge variant={livePunchData?.isActive ? 'default' : 'secondary'}>
                  {livePunchData?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setActiveTab('live-punch-monitor')}
            >
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Job Progress Card */}
        <Card className="border border-border shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5 text-primary" />
              Job Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Top Jobsites */}
            <div className="space-y-3">
              {jobsiteProgressData.length > 0 ? (
                jobsiteProgressData.map((job) => (
                  <div key={job.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate">{job.name}</span>
                      <span className="text-xs text-muted-foreground">{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} className="h-1" />
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No active jobsites
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setActiveTab('jobsite-progress')}
            >
              View Full Job Progress
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Timesheet Submission */}
      <Card className="border border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Weekly Timesheet Submission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ForemanTimesheetForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ForemanDashboardHome;
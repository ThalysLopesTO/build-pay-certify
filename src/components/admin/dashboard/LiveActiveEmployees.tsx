
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSearchParams } from 'react-router-dom';
import { Users, Clock, RefreshCw, LogIn, LogOut } from 'lucide-react';

interface PunchActivity {
  id: string;
  user_id: string;
  activity_type: 'punch_in' | 'punch_out';
  timestamp: string;
  timesheet_id: string;
  jobsite_name: string;
  employee_name: string;
  role?: string;
  time_worked?: string;
  is_active?: boolean;
}

const LiveActiveEmployees = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activities, setActivities] = useState<PunchActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async (isManualRefresh = false) => {
    // Get the date from URL parameter or default to today
    const dateParam = searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().split('T')[0];
    
    console.log('🔍 LiveActiveEmployees: Fetching activities', { 
      userCompanyId: user?.companyId, 
      userRole: user?.role,
      targetDate,
      isManualRefresh 
    });

    if (!user?.companyId) {
      const errorMsg = `No company ID available. User: ${user?.email || 'none'}, CompanyId: ${user?.companyId || 'none'}`;
      console.error('❌ LiveActiveEmployees:', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      return;
    }

    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      console.log('📊 Querying timesheets for date:', targetDate);
      
      // Get all timesheets for the specified date (both active and completed)
      const { data: timesheets, error: timesheetsError } = await supabase
        .from('timesheets')
        .select(`
          id,
          user_id,
          check_in_time,
          check_out_time,
          company_id,
          jobsite_id
        `)
        .eq('company_id', user.companyId)
        .or(`and(check_in_time.gte.${targetDate}T00:00:00,check_in_time.lte.${targetDate}T23:59:59),and(check_out_time.gte.${targetDate}T00:00:00,check_out_time.lte.${targetDate}T23:59:59),and(created_at.gte.${targetDate}T00:00:00,created_at.lte.${targetDate}T23:59:59)`)
        .order('check_in_time', { ascending: false });

      if (timesheetsError) {
        console.error('❌ Database error fetching timesheets:', timesheetsError);
        setError(`Database error: ${timesheetsError.message}`);
        return;
      }

      // Collect all unique user IDs and jobsite IDs
      const userIds = [...new Set((timesheets || []).map(t => t.user_id))];
      const jobsiteIds = [...new Set((timesheets || []).map(t => t.jobsite_id).filter(Boolean))];

      console.log('🔍 Fetching user profiles and jobsites', { 
        userIds: userIds.length, 
        jobsiteIds: jobsiteIds.length,
        timesheets: timesheets?.length || 0
      });

      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, role')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('⚠️ Error fetching user profiles:', profilesError);
      }

      // Get jobsites
      let jobsites: any[] = [];
      if (jobsiteIds.length > 0) {
        const { data: jobsiteData, error: jobsiteError } = await supabase
          .from('jobsites')
          .select('id, name')
          .in('id', jobsiteIds);

        if (jobsiteError) {
          console.warn('⚠️ Error fetching jobsites:', jobsiteError);
        } else {
          jobsites = jobsiteData || [];
        }
      }

      // Create lookup maps
      const profileMap = new Map(
        profiles?.map(profile => [profile.user_id, profile]) || []
      );
      const jobsiteMap = new Map(
        jobsites.map(jobsite => [jobsite.id, jobsite])
      );

      // Transform timesheets into punch activities
      const allActivities: PunchActivity[] = [];
      
      (timesheets || []).forEach((timesheet) => {
        const profile = profileMap.get(timesheet.user_id);
        const jobsite = jobsiteMap.get(timesheet.jobsite_id);
        const employeeName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Former Employee'
          : 'Former Employee';
        const jobsiteName = jobsite?.name || 'Unknown Jobsite';
        
        // Add punch-in activity
        allActivities.push({
          id: `${timesheet.id}-in`,
          user_id: timesheet.user_id,
          activity_type: 'punch_in',
          timestamp: timesheet.check_in_time,
          timesheet_id: timesheet.id,
          jobsite_name: jobsiteName,
          employee_name: employeeName,
          role: profile?.role || 'employee',
          is_active: !timesheet.check_out_time
        });
        
        // Add punch-out activity if exists
        if (timesheet.check_out_time) {
          allActivities.push({
            id: `${timesheet.id}-out`,
            user_id: timesheet.user_id,
            activity_type: 'punch_out',
            timestamp: timesheet.check_out_time,
            timesheet_id: timesheet.id,
            jobsite_name: jobsiteName,
            employee_name: employeeName,
            role: profile?.role || 'employee',
            time_worked: getTimeWorked(timesheet.check_in_time, timesheet.check_out_time)
          });
        }
      });
      
      // Sort activities by timestamp (most recent first)
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      console.log('✅ Successfully formatted activities:', { 
        totalActivities: allActivities.length,
        timesheets: timesheets?.length || 0
      });
      
      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
      if (isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  const handleManualRefresh = () => {
    fetchActivities(true);
  };

  useEffect(() => {
    fetchActivities();

    // Set up real-time subscription for timesheets
    const channel = supabase
      .channel('timesheets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timesheets',
          filter: `company_id=eq.${user?.companyId}`
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    // Refresh every 30 seconds as backup
    const interval = setInterval(fetchActivities, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user?.companyId, searchParams.get('date')]);

  const formatClockInTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeWorked = (checkInTime: string, checkOutTime?: string) => {
    const endTime = checkOutTime ? new Date(checkOutTime) : new Date();
    const clockIn = new Date(checkInTime);
    const diffMs = endTime.getTime() - clockIn.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Live Punch-ins</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            Loading active employees...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Daily Activities</CardTitle>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-6">
            <div className="text-red-500 mb-2">⚠️ {error}</div>
            <Button onClick={handleManualRefresh} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No punch activities for this date
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-full ${
                    activity.activity_type === 'punch_in' 
                      ? activity.is_active 
                        ? 'bg-green-100' 
                        : 'bg-blue-100' 
                      : 'bg-red-100'
                  }`}>
                    {activity.activity_type === 'punch_in' ? (
                      <LogIn className={`h-3 w-3 ${
                        activity.is_active ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    ) : (
                      <LogOut className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{activity.employee_name}</div>
                    <div className="text-sm text-gray-600">{activity.jobsite_name}</div>
                    {activity.role && (
                      <div className="text-xs text-blue-600 font-medium capitalize">{activity.role}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatClockInTime(activity.timestamp)}
                  </div>
                  <div className={`text-xs font-medium ${
                    activity.activity_type === 'punch_in'
                      ? activity.is_active
                        ? 'text-green-600'
                        : 'text-blue-600'
                      : 'text-red-600'
                  }`}>
                    {activity.activity_type === 'punch_in' 
                      ? activity.is_active 
                        ? 'Currently Active'
                        : 'Punched In'
                      : `Punched Out${activity.time_worked ? ` • ${activity.time_worked}` : ''}`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveActiveEmployees;

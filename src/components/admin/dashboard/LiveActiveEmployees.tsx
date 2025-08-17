
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Users, Clock, RefreshCw, CheckCircle } from 'lucide-react';

interface ActiveEmployee {
  id: string;
  user_id: string;
  check_in_time: string;
  jobsite_name: string;
  employee_name: string;
  role?: string;
}

interface CompletedEmployee {
  id: string;
  user_id: string;
  check_in_time: string;
  check_out_time: string;
  jobsite_name: string;
  employee_name: string;
  role?: string;
}

const LiveActiveEmployees = () => {
  const { user } = useAuth();
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);
  const [completedEmployees, setCompletedEmployees] = useState<CompletedEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveEmployees = async (isManualRefresh = false) => {
    console.log('🔍 LiveActiveEmployees: Fetching punch-ins', { 
      userCompanyId: user?.companyId, 
      userRole: user?.role,
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
      const today = new Date().toISOString().split('T')[0];
      console.log('📊 Querying timesheets for today:', today);
      
      // Get active punch-ins (check_in_time exists, check_out_time is null)
      const { data: activeTimesheets, error: activeError } = await supabase
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
        .is('check_out_time', null)
        .not('check_in_time', 'is', null)
        .order('check_in_time', { ascending: false });

      // Get completed punch-ins from today
      const { data: completedTimesheets, error: completedError } = await supabase
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
        .not('check_out_time', 'is', null)
        .gte('check_in_time', `${today}T00:00:00`)
        .lt('check_in_time', `${today}T23:59:59`)
        .order('check_out_time', { ascending: false });

      if (activeError) {
        console.error('❌ Database error fetching active punch-ins:', activeError);
        setError(`Database error: ${activeError.message}`);
        return;
      }

      if (completedError) {
        console.error('❌ Database error fetching completed punch-ins:', completedError);
      }

      // Collect all unique user IDs and jobsite IDs
      const allTimesheets = [...(activeTimesheets || []), ...(completedTimesheets || [])];
      const userIds = [...new Set(allTimesheets.map(t => t.user_id))];
      const jobsiteIds = [...new Set(allTimesheets.map(t => t.jobsite_id).filter(Boolean))];

      console.log('🔍 Fetching user profiles and jobsites', { 
        userIds: userIds.length, 
        jobsiteIds: jobsiteIds.length,
        active: activeTimesheets?.length || 0,
        completed: completedTimesheets?.length || 0
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

      // Format active employees
      const formattedActiveEmployees = (activeTimesheets || []).map((timesheet) => {
        const profile = profileMap.get(timesheet.user_id);
        const jobsite = jobsiteMap.get(timesheet.jobsite_id);
        
        return {
          id: timesheet.id,
          user_id: timesheet.user_id,
          check_in_time: timesheet.check_in_time,
          jobsite_name: jobsite?.name || 'Unknown Jobsite',
          employee_name: profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Former Employee'
            : 'Former Employee',
          role: profile?.role || 'employee'
        };
      });

      // Format completed employees
      const formattedCompletedEmployees = (completedTimesheets || []).map((timesheet) => {
        const profile = profileMap.get(timesheet.user_id);
        const jobsite = jobsiteMap.get(timesheet.jobsite_id);
        
        return {
          id: timesheet.id,
          user_id: timesheet.user_id,
          check_in_time: timesheet.check_in_time,
          check_out_time: timesheet.check_out_time,
          jobsite_name: jobsite?.name || 'Unknown Jobsite',
          employee_name: profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Former Employee'
            : 'Former Employee',
          role: profile?.role || 'employee'
        };
      });

      console.log('✅ Successfully formatted employees:', { 
        active: formattedActiveEmployees.length,
        completed: formattedCompletedEmployees.length
      });
      
      setActiveEmployees(formattedActiveEmployees);
      setCompletedEmployees(formattedCompletedEmployees);
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
    fetchActiveEmployees(true);
  };

  useEffect(() => {
    fetchActiveEmployees();

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
          fetchActiveEmployees();
        }
      )
      .subscribe();

    // Refresh every 30 seconds as backup
    const interval = setInterval(fetchActiveEmployees, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user?.companyId]);

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
            <CardTitle className="text-xl font-semibold text-gray-900">Live Punch-ins</CardTitle>
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
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Currently Active ({activeEmployees.length})</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Today's Activity ({completedEmployees.length})</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              {activeEmployees.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No active punch-ins at the moment
                </div>
              ) : (
                <div className="space-y-3">
                  {activeEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{employee.employee_name}</div>
                        <div className="text-sm text-gray-600">{employee.jobsite_name}</div>
                        {employee.role && (
                          <div className="text-xs text-blue-600 font-medium capitalize">{employee.role}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatClockInTime(employee.check_in_time)}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          {getTimeWorked(employee.check_in_time)} worked
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              {completedEmployees.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No completed shifts today
                </div>
              ) : (
                <div className="space-y-3">
                  {completedEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{employee.employee_name}</div>
                        <div className="text-sm text-gray-600">{employee.jobsite_name}</div>
                        {employee.role && (
                          <div className="text-xs text-blue-600 font-medium capitalize">{employee.role}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatClockInTime(employee.check_in_time)} - {formatClockInTime(employee.check_out_time)}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {getTimeWorked(employee.check_in_time, employee.check_out_time)} total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveActiveEmployees;

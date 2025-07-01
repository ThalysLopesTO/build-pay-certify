
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Users, Clock } from 'lucide-react';

interface ActiveEmployee {
  id: string;
  user_id: string;
  check_in_time: string;
  jobsite_name: string;
  employee_name: string;
}

const LiveActiveEmployees = () => {
  const { user } = useAuth();
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveEmployees = async () => {
    if (!user?.companyId) return;

    try {
      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          id,
          user_id,
          check_in_time,
          jobsite_id,
          jobsites (name),
          user_profiles (first_name, last_name)
        `)
        .eq('company_id', user.companyId)
        .is('check_out_time', null)
        .not('check_in_time', 'is', null)
        .order('check_in_time', { ascending: false });

      if (error) {
        console.error('Error fetching active employees:', error);
        return;
      }

      const formattedEmployees = data?.map((timesheet: any) => ({
        id: timesheet.id,
        user_id: timesheet.user_id,
        check_in_time: timesheet.check_in_time,
        jobsite_name: timesheet.jobsites?.name || 'Unknown Jobsite',
        employee_name: `${timesheet.user_profiles?.first_name || ''} ${timesheet.user_profiles?.last_name || ''}`.trim() || 'Unknown Employee'
      })) || [];

      setActiveEmployees(formattedEmployees);
    } catch (error) {
      console.error('Error fetching active employees:', error);
    } finally {
      setIsLoading(false);
    }
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

  const getTimeWorked = (checkInTime: string) => {
    const now = new Date();
    const clockIn = new Date(checkInTime);
    const diffMs = now.getTime() - clockIn.getTime();
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
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeEmployees.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No active employees at the moment
          </div>
        ) : (
          <div className="space-y-3">
            {activeEmployees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{employee.employee_name}</div>
                  <div className="text-sm text-gray-600">{employee.jobsite_name}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatClockInTime(employee.check_in_time)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getTimeWorked(employee.check_in_time)} worked
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

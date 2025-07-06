import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface TodayPunchin {
  id: string;
  check_in_time: string;
  employee_name: string;
}

const LivePunchinsCard: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { user } = useAuth();

  const { data: todayPunchins, isLoading } = useQuery({
    queryKey: ['today-punchins', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // First get the timesheets for today
      const { data: timesheets, error: timesheetsError } = await supabase
        .from('timesheets')
        .select('id, check_in_time, user_id')
        .eq('company_id', user.companyId)
        .gte('check_in_time', today.toISOString())
        .lt('check_in_time', tomorrow.toISOString())
        .order('check_in_time', { ascending: false })
        .limit(5);

      if (timesheetsError) {
        console.error('Error fetching today timesheets:', timesheetsError);
        return [];
      }

      if (!timesheets || timesheets.length === 0) return [];

      // Get employee names for the timesheet entries
      const userIds = timesheets.map(t => t.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching employee profiles:', profilesError);
        return timesheets.map(t => ({
          id: t.id,
          check_in_time: t.check_in_time,
          employee_name: 'Unknown Employee'
        }));
      }

      // Combine the data
      return timesheets.map(timesheet => {
        const profile = profiles?.find(p => p.user_id === timesheet.user_id);
        return {
          id: timesheet.id,
          check_in_time: timesheet.check_in_time,
          employee_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Employee'
        };
      });
    },
    enabled: !!user?.companyId,
    staleTime: 30 * 1000, // 30 seconds
  });

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card 
      className="bg-dashboard-live-bg border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-dashboard-live-icon">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Live Punch-ins</h3>
              <p className="text-sm text-muted-foreground">Today's entries</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : todayPunchins && todayPunchins.length > 0 ? (
          <>
            {todayPunchins.slice(0, 4).map((punchin) => (
              <div key={punchin.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-foreground">
                    {punchin.employee_name}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground font-mono">
                  {formatTime(punchin.check_in_time)}
                </span>
              </div>
            ))}
            {todayPunchins.length > 4 && (
              <div className="pt-2 text-center">
                <span className="text-xs text-muted-foreground">
                  +{todayPunchins.length - 4} more punch-ins today
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No punches registered yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LivePunchinsCard;
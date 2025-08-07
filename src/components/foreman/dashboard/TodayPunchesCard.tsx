import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Clock, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface PunchEntry {
  id: string;
  user_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  jobsite_id: string;
  employee_name: string;
  employee_photo: string | null;
  jobsite_name: string;
  punch_type: 'IN' | 'OUT';
  punch_time: string;
}

interface TodayPunchesCardProps {
  setActiveTab: (tab: string) => void;
}

const TodayPunchesCard: React.FC<TodayPunchesCardProps> = ({ setActiveTab }) => {
  const { user } = useAuth();

  const { data: todayPunches = [], isLoading } = useQuery<PunchEntry[]>({
    queryKey: ['today-punches', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');

      const today = new Date().toISOString().split('T')[0];
      
      // Get all punches for today
      const { data: timesheets, error } = await supabase
        .from('timesheets')
        .select(`
          id,
          user_id,
          check_in_time,
          check_out_time,
          jobsite_id,
          jobsites!inner(name),
          user_profiles!inner(first_name, last_name, photo_url)
        `)
        .eq('company_id', user.companyId)
        .gte('check_in_time', `${today}T00:00:00`)
        .lte('check_in_time', `${today}T23:59:59`)
        .order('check_in_time', { ascending: false });

      if (error) throw error;

      // Process the data to create entries for both check-in and check-out
      const entries: PunchEntry[] = [];
      
      timesheets?.forEach((timesheet) => {
        const employeeName = `${timesheet.user_profiles.first_name} ${timesheet.user_profiles.last_name}`;
        const jobsiteName = timesheet.jobsites.name;
        
        // Add check-in entry
        entries.push({
          id: `${timesheet.id}-in`,
          user_id: timesheet.user_id,
          check_in_time: timesheet.check_in_time,
          check_out_time: timesheet.check_out_time,
          jobsite_id: timesheet.jobsite_id,
          employee_name: employeeName,
          employee_photo: timesheet.user_profiles.photo_url,
          jobsite_name: jobsiteName,
          punch_type: 'IN',
          punch_time: timesheet.check_in_time
        });

        // Add check-out entry if exists
        if (timesheet.check_out_time) {
          entries.push({
            id: `${timesheet.id}-out`,
            user_id: timesheet.user_id,
            check_in_time: timesheet.check_in_time,
            check_out_time: timesheet.check_out_time,
            jobsite_id: timesheet.jobsite_id,
            employee_name: employeeName,
            employee_photo: timesheet.user_profiles.photo_url,
            jobsite_name: jobsiteName,
            punch_type: 'OUT',
            punch_time: timesheet.check_out_time
          });
        }
      });

      // Sort by punch time (latest first)
      return entries.sort((a, b) => new Date(b.punch_time).getTime() - new Date(a.punch_time).getTime());
    },
    enabled: !!user?.companyId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const currentlyPunchedIn = todayPunches.filter(entry => 
    entry.punch_type === 'IN' && !todayPunches.some(outEntry => 
      outEntry.user_id === entry.user_id && 
      outEntry.punch_type === 'OUT' && 
      new Date(outEntry.punch_time) > new Date(entry.punch_time)
    )
  ).length;

  return (
    <Card className="border border-border shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          Live Punch Monitor
          <Badge variant="outline" className="ml-auto">
            {currentlyPunchedIn} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentlyPunchedIn}
              </div>
              <div className="text-xs text-muted-foreground">Currently In</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {todayPunches.length}
              </div>
              <div className="text-xs text-muted-foreground">Total Punches</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium">Live</span>
          </div>
        </div>

        {/* Punch List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Today's Activity</h4>
          <ScrollArea className="h-64 w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            ) : todayPunches.length > 0 ? (
              <div className="space-y-2 pr-4">
                {todayPunches.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.employee_photo || ''} alt={entry.employee_name} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(entry.employee_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{entry.employee_name}</span>
                        <Badge 
                          variant={entry.punch_type === 'IN' ? 'default' : 'secondary'} 
                          className="text-xs px-2 py-0.5"
                        >
                          <span className="flex items-center gap-1">
                            {entry.punch_type === 'IN' ? (
                              <LogIn className="h-3 w-3" />
                            ) : (
                              <LogOut className="h-3 w-3" />
                            )}
                            {entry.punch_type}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {entry.jobsite_name}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatTime(entry.punch_time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <div className="text-sm text-muted-foreground">No punches today</div>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full hover:bg-primary/5" 
          onClick={() => setActiveTab('live-punch-monitor')}
        >
          View Full Punch History
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default TodayPunchesCard;
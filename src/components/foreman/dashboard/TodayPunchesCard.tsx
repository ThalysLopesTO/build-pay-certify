import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Clock, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { DashboardCardHeader } from '@/components/common/DashboardCardHeader';
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
const TodayPunchesCard: React.FC<TodayPunchesCardProps> = ({
  setActiveTab
}) => {
  const {
    user
  } = useAuth();
  const {
    data: todayPunches = [],
    isLoading,
    refetch
  } = useQuery<PunchEntry[]>({
    queryKey: ['today-punches', user?.companyId, user?.id],
    queryFn: async () => {
      if (!user?.companyId || !user?.id) throw new Error('Missing user or company ID');
      const today = new Date().toISOString().split('T')[0];

      // Fetch assigned jobsites for this foreman
      const {
        data: assignments,
        error: assignErr
      } = await supabase.from('jobsite_foremen').select('jobsite_id').eq('foreman_id', user.id);
      if (assignErr) throw assignErr;
      const assignedIds = (assignments || []).map((a: any) => a.jobsite_id);

      // Build base query for today's timesheets
      let query = supabase.from('timesheets').select(`
          id,
          user_id,
          check_in_time,
          check_out_time,
          jobsite_id,
          jobsites!inner(name),
          user_profiles!inner(first_name, last_name, photo_url)
        `).eq('company_id', user.companyId).gte('check_in_time', `${today}T00:00:00`).lte('check_in_time', `${today}T23:59:59`).order('check_in_time', {
        ascending: false
      });
      if (assignedIds.length > 0) {
        query = query.in('jobsite_id', assignedIds);
      }
      const {
        data: timesheets,
        error
      } = await query;
      if (error) throw error;
      const entries: PunchEntry[] = [];
      timesheets?.forEach((timesheet: any) => {
        const profile = Array.isArray(timesheet.user_profiles) ? timesheet.user_profiles[0] : timesheet.user_profiles;
        const jobsite = Array.isArray(timesheet.jobsites) ? timesheet.jobsites[0] : timesheet.jobsites;
        const employeeName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
        const jobsiteName = jobsite?.name || '';
        entries.push({
          id: `${timesheet.id}-in`,
          user_id: timesheet.user_id,
          check_in_time: timesheet.check_in_time,
          check_out_time: timesheet.check_out_time,
          jobsite_id: timesheet.jobsite_id,
          employee_name: employeeName,
          employee_photo: profile?.photo_url || null,
          jobsite_name: jobsiteName,
          punch_type: 'IN',
          punch_time: timesheet.check_in_time
        });
        if (timesheet.check_out_time) {
          entries.push({
            id: `${timesheet.id}-out`,
            user_id: timesheet.user_id,
            check_in_time: timesheet.check_in_time,
            check_out_time: timesheet.check_out_time,
            jobsite_id: timesheet.jobsite_id,
            employee_name: employeeName,
            employee_photo: profile?.photo_url || null,
            jobsite_name: jobsiteName,
            punch_type: 'OUT',
            punch_time: timesheet.check_out_time
          });
        }
      });
      return entries.sort((a, b) => new Date(b.punch_time).getTime() - new Date(a.punch_time).getTime());
    },
    enabled: !!user?.companyId && !!user?.id,
    refetchInterval: 30000
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
  const currentlyPunchedIn = todayPunches.filter(entry => entry.punch_type === 'IN' && !todayPunches.some(outEntry => outEntry.user_id === entry.user_id && outEntry.punch_type === 'OUT' && new Date(outEntry.punch_time) > new Date(entry.punch_time))).length;

  // Realtime subscribe to updates
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!user?.companyId) return;
    
    // Create unique channel name to prevent conflicts
    const channelName = `timesheets-live-foreman-${user.companyId}-${Date.now()}`;
    
    const channel = supabase.channel(channelName).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'timesheets'
    }, () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        refetch();
      }, 300);
    }).subscribe();
    
    return () => {
      supabase.removeChannel(channel);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [user?.companyId]); // Remove refetch from dependencies
  return <Card className="border border-border shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl overflow-hidden">
      <DashboardCardHeader title="Live Punch Monitor" icon={<Users className="h-5 w-5" />} accent="green" statusPill={<span aria-live="polite" className="inline-flex items-center gap-2 text-xs font-medium bg-white/10 rounded-full px-3 py-1 text-gray-50">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Live
          </span>} />
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-6" aria-live="polite">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{currentlyPunchedIn}</div>
              <div className="text-xs text-muted-foreground">Currently In</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{todayPunches.length}</div>
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
            {isLoading ? <div className="flex items-center justify-center h-32">
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div> : todayPunches.length > 0 ? <div className="space-y-2 pr-4">
                {todayPunches.slice(0, 5).map(entry => <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.employee_photo || ''} alt={entry.employee_name} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(entry.employee_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{entry.employee_name}</span>
                        <Badge variant={entry.punch_type === 'IN' ? 'default' : 'secondary'} className="text-xs px-2 py-0.5">
                          <span className="flex items-center gap-1">
                            {entry.punch_type === 'IN' ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />}
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
                  </div>)}
              </div> : <div className="flex flex-col items-center justify-center h-32 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <div className="text-sm text-muted-foreground">No punches today</div>
              </div>}
          </ScrollArea>
        </div>

        <Button variant="outline" className="w-full hover:bg-primary/5 focus-visible:ring-offset-2 focus-visible:ring-2" onClick={() => setActiveTab('live-punch-monitor')} aria-label="View full punch history">
          View Full Punch History
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>;
};
export default TodayPunchesCard;
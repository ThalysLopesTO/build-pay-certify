
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import LocationMapModal from './LocationMapModal';
import EditPunchModal from './timesheets/EditPunchModal';
import LivePunchFilters from './live-punch-monitor/LivePunchFilters';
import LivePunchSummaryCards from './live-punch-monitor/LivePunchSummaryCards';
import LivePunchTable from './live-punch-monitor/LivePunchTable';
import { useDeleteTimesheet } from '@/hooks/useDeleteTimesheet';

interface PunchEntry {
  id: string;
  user_id: string;
  jobsite_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  status: string;
  user_profiles: {
    first_name: string;
    last_name: string;
  } | null;
  jobsites: {
    name: string;
  } | null;
}

const LivePunchMonitor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const deleteTimesheet = useDeleteTimesheet();
  const [selectedJobsite, setSelectedJobsite] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [flaggedEntries, setFlaggedEntries] = useState<Set<string>>(new Set());
  const [editingTimesheet, setEditingTimesheet] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    location: string | null;
    employeeName: string;
    timestamp: string;
  } | null>(null);

  // Fetch jobsites for filter
  const { data: jobsites } = useQuery({
    queryKey: ['jobsites', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from('jobsites')
        .select('id, name')
        .eq('company_id', user.companyId)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId,
  });

  // Fetch employees for filter
  const { data: employees } = useQuery({
    queryKey: ['employees', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .eq('company_id', user.companyId)
        .in('role', ['employee', 'foreman'])
        .order('first_name');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId,
  });

  // Fetch punch entries for the selected date
  const { data: punchEntries, isLoading, refetch } = useQuery({
    queryKey: ['live-punch-monitor', user?.companyId, selectedDate],
    queryFn: async () => {
      if (!user?.companyId) return [];

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // First get timesheets
      const { data: timesheets, error: timesheetsError } = await supabase
        .from('timesheets')
        .select(`
          id,
          user_id,
          jobsite_id,
          check_in_time,
          check_out_time,
          check_in_location,
          check_out_location,
          status
        `)
        .eq('company_id', user.companyId)
        .gte('check_in_time', startOfDay.toISOString())
        .lte('check_in_time', endOfDay.toISOString())
        .order('check_in_time', { ascending: false });

      if (timesheetsError) {
        console.error('Error fetching timesheets:', timesheetsError);
        throw timesheetsError;
      }

      if (!timesheets || timesheets.length === 0) {
        return [];
      }

      // Get user profiles for the timesheets
      const userIds = [...new Set(timesheets.map(t => t.user_id))];
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        throw profilesError;
      }

      // Get jobsites for the timesheets
      const jobsiteIds = [...new Set(timesheets.map(t => t.jobsite_id))];
      const { data: jobsites, error: jobsitesError } = await supabase
        .from('jobsites')
        .select('id, name')
        .in('id', jobsiteIds);

      if (jobsitesError) {
        console.error('Error fetching jobsites:', jobsitesError);
        throw jobsitesError;
      }

      // Combine the data
      const combinedData: PunchEntry[] = timesheets.map(timesheet => {
        const userProfile = userProfiles?.find(profile => profile.user_id === timesheet.user_id);
        const jobsite = jobsites?.find(js => js.id === timesheet.jobsite_id);
        
        return {
          ...timesheet,
          user_profiles: userProfile ? {
            first_name: userProfile.first_name || '',
            last_name: userProfile.last_name || ''
          } : null,
          jobsites: jobsite ? {
            name: jobsite.name
          } : null
        };
      });

      return combinedData;
    },
    enabled: !!user?.companyId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const handleEdit = (timesheet: any) => {
    setEditingTimesheet(timesheet);
  };

  const toggleFlag = (entryId: string) => {
    setFlaggedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const handleViewLocation = (entry: PunchEntry) => {
    const employeeName = entry.user_profiles ? 
      `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 
      'Unknown Employee';
    
    const timestamp = entry.check_in_time ? 
      format(new Date(entry.check_in_time), 'MMM dd, yyyy h:mm a') : 
      'Unknown time';

    setSelectedLocation({
      location: entry.check_in_location,
      employeeName,
      timestamp
    });
  };

  // Filter entries
  const filteredEntries = punchEntries?.filter(entry => {
    if (selectedJobsite !== 'all' && entry.jobsite_id !== selectedJobsite) return false;
    if (selectedEmployee !== 'all' && entry.user_id !== selectedEmployee) return false;
    if (statusFilter !== 'all') {
      const isActive = !entry.check_out_time;
      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'completed' && isActive) return false;
    }
    return true;
  }) || [];

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Punch data has been updated.",
    });
  };

  const handleDelete = (entry: PunchEntry) => {
    deleteTimesheet.mutate(entry.id);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Punch Monitor</h1>
          <p className="text-muted-foreground">
            {isToday(selectedDate) 
              ? `Real-time monitoring and editing of employee punch records for ${format(selectedDate, 'EEEE, MMMM dd, yyyy')}`
              : `Employee punch records for ${format(selectedDate, 'EEEE, MMMM dd, yyyy')}`
            }
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Date Display */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5 text-orange-500" />
            <span>Viewing: {format(selectedDate, 'EEEE, MMMM dd, yyyy')}</span>
            {isToday(selectedDate) && (
              <Badge variant="outline" className="ml-2">Today</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <LivePunchFilters
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedJobsite={selectedJobsite}
        setSelectedJobsite={setSelectedJobsite}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        jobsites={jobsites}
        employees={employees}
      />

      {/* Summary Cards */}
      <LivePunchSummaryCards
        filteredEntries={filteredEntries}
        selectedDate={selectedDate}
      />

      {/* Punch Entries Table with Edit and Delete functionality */}
      <LivePunchTable
        filteredEntries={filteredEntries}
        selectedDate={selectedDate}
        flaggedEntries={flaggedEntries}
        onToggleFlag={toggleFlag}
        onViewLocation={handleViewLocation}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Punch Modal */}
      {editingTimesheet && (
        <EditPunchModal
          isOpen={!!editingTimesheet}
          onClose={() => setEditingTimesheet(null)}
          timesheet={editingTimesheet}
        />
      )}

      {/* Location Map Modal */}
      {selectedLocation && (
        <LocationMapModal
          isOpen={!!selectedLocation}
          onClose={() => setSelectedLocation(null)}
          location={selectedLocation.location}
          employeeName={selectedLocation.employeeName}
          timestamp={selectedLocation.timestamp}
        />
      )}
    </div>
  );
};

export default LivePunchMonitor;

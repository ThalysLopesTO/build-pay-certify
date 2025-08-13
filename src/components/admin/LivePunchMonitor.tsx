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
    latitude: number | null;
    longitude: number | null;
  } | null;
}
const LivePunchMonitor = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const deleteTimesheet = useDeleteTimesheet();
  const [selectedJobsite, setSelectedJobsite] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [flaggedEntries, setFlaggedEntries] = useState<Set<string>>(new Set());
  const [editingTimesheet, setEditingTimesheet] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    punchLocation: string | null;
    employeeName: string;
    timestamp: string;
    // TODO: Will re-add jobsite prop later for distance calculations
  } | null>(null);

  // Fetch jobsites for filter
  const {
    data: jobsites
  } = useQuery({
    queryKey: ['jobsites', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const {
        data,
        error
      } = await supabase.from('jobsites').select('id, name').eq('company_id', user.companyId).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId
  });

  // Fetch employees for filter
  const {
    data: employees
  } = useQuery({
    queryKey: ['employees', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const {
        data,
        error
      } = await supabase.from('user_profiles').select('user_id, first_name, last_name').eq('company_id', user.companyId).in('role', ['employee', 'foreman']).order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId
  });

  // Fetch punch entries for the selected date
  const {
    data: punchEntries,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['live-punch-monitor', user?.companyId, selectedDate, selectedJobsite, selectedEmployee, statusFilter],
    queryFn: async () => {
      if (!user?.companyId) return [];
      let query = supabase.from('timesheets').select(`
          id,
          user_id,
          jobsite_id,
          check_in_time,
          check_out_time,
          check_in_location,
          check_out_location,
          status,
          created_at
        `).eq('company_id', user.companyId);

      // Apply employee filter if selected
      if (selectedEmployee !== 'all') {
        query = query.eq('user_id', selectedEmployee);
      }

      // Apply jobsite filter if selected
      if (selectedJobsite !== 'all') {
        query = query.eq('jobsite_id', selectedJobsite);
      }

      // Apply date filter only if a specific date is selected
      // If no date is selected, don't filter by date (show all historical data)
      // If date is selected, filter to that specific date
      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.or(`and(check_in_time.gte.${startOfDay.toISOString()},check_in_time.lte.${endOfDay.toISOString()}),and(check_out_time.gte.${startOfDay.toISOString()},check_out_time.lte.${endOfDay.toISOString()}),and(check_in_time.is.null,check_out_time.is.null,created_at.gte.${startOfDay.toISOString()},created_at.lte.${endOfDay.toISOString()})`);
      } else {
        // If no specific filters are set, default to today's records
        const hasFilters = selectedEmployee !== 'all' || selectedJobsite !== 'all' || statusFilter !== 'all';
        if (!hasFilters) {
          const today = new Date();
          const startOfToday = new Date(today);
          startOfToday.setHours(0, 0, 0, 0);
          const endOfToday = new Date(today);
          endOfToday.setHours(23, 59, 59, 999);
          query = query.or(`and(check_in_time.gte.${startOfToday.toISOString()},check_in_time.lte.${endOfToday.toISOString()}),and(check_out_time.gte.${startOfToday.toISOString()},check_out_time.lte.${endOfToday.toISOString()}),and(check_in_time.is.null,check_out_time.is.null,created_at.gte.${startOfToday.toISOString()},created_at.lte.${endOfToday.toISOString()})`);
        }
      }
      const {
        data: timesheets,
        error: timesheetsError
      } = await query.order('check_in_time', {
        ascending: false,
        nullsFirst: false
      }).limit(1000); // Reasonable limit for performance

      if (timesheetsError) {
        console.error('Error fetching timesheets:', timesheetsError);
        throw timesheetsError;
      }
      if (!timesheets || timesheets.length === 0) {
        return [];
      }

      // Get user profiles for the timesheets
      const userIds = [...new Set(timesheets.map(t => t.user_id))];
      const {
        data: userProfiles,
        error: profilesError
      } = await supabase.from('user_profiles').select('user_id, first_name, last_name').in('user_id', userIds);
      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        throw profilesError;
      }

      // Get jobsites for the timesheets
      const jobsiteIds = [...new Set(timesheets.map(t => t.jobsite_id))];
      const {
        data: jobsites,
        error: jobsitesError
      } = await supabase.from('jobsites').select('id, name, latitude, longitude').in('id', jobsiteIds);
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
            name: jobsite.name,
            latitude: jobsite.latitude,
            longitude: jobsite.longitude
          } : null
        };
      });
      return combinedData;
    },
    enabled: !!user?.companyId,
    refetchInterval: 60000 // Refresh every 60 seconds for real-time updates
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
    const employeeName = entry.user_profiles ? `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 'Unknown Employee';
    const timestamp = entry.check_in_time ? format(new Date(entry.check_in_time), 'MMM dd, yyyy h:mm a') : 'Unknown time';
    setSelectedLocation({
      punchLocation: entry.check_in_location,
      employeeName,
      timestamp
      // TODO: Will re-add jobsite data later for distance calculations
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
      description: "Punch data has been updated."
    });
  };
  const handleClearFilters = () => {
    setSelectedDate(new Date());
    setSelectedJobsite('all');
    setSelectedEmployee('all');
    setStatusFilter('all');
  };
  const hasActiveFilters = () => {
    const today = new Date().toDateString();
    const isNotToday = selectedDate ? selectedDate.toDateString() !== today : false;
    return isNotToday || selectedJobsite !== 'all' || selectedEmployee !== 'all' || statusFilter !== 'all';
  };
  const handleDelete = (entry: PunchEntry) => {
    deleteTimesheet.mutate(entry.id);
  };
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>;
  }
  return <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Professional Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Live Punch Monitor</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Real-time tracking and management of employee punch records
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="lg" className="gap-2 hover:bg-accent/50 transition-all duration-200">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <LivePunchSummaryCards filteredEntries={filteredEntries} selectedDate={selectedDate} />

      {/* Modern Filter Panel */}
      <Card className="shadow-sm border-accent/20">
        <CardContent className="p-6">
          
          <LivePunchFilters selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedJobsite={selectedJobsite} setSelectedJobsite={setSelectedJobsite} selectedEmployee={selectedEmployee} setSelectedEmployee={setSelectedEmployee} statusFilter={statusFilter} setStatusFilter={setStatusFilter} jobsites={jobsites} employees={employees} onClearFilters={handleClearFilters} hasActiveFilters={hasActiveFilters()} />
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Punch Records</h2>
            <Badge variant="secondary" className="px-3 py-1">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'record' : 'records'}
            </Badge>
          </div>
          {selectedDate && <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(selectedDate, 'EEEE, MMMM dd, yyyy')}</span>
              {isToday(selectedDate) && <Badge variant="outline" className="ml-2 text-xs">Live</Badge>}
            </div>}
          {!selectedDate && hasActiveFilters() && <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>All Dates</span>
            </div>}
        </div>

        {/* Punch Entries Table */}
        <Card className="shadow-sm">
          <LivePunchTable filteredEntries={filteredEntries} selectedDate={selectedDate} flaggedEntries={flaggedEntries} onToggleFlag={toggleFlag} onViewLocation={handleViewLocation} onEdit={handleEdit} onDelete={handleDelete} />
        </Card>
      </div>

      {/* Edit Punch Modal */}
      {editingTimesheet && <EditPunchModal isOpen={!!editingTimesheet} onClose={() => setEditingTimesheet(null)} timesheet={editingTimesheet} onSuccess={() => refetch()} />}

      {/* Location Map Modal */}
      {selectedLocation && (() => {
      const [lat, lng] = selectedLocation.punchLocation.split(',').map(Number);
      return <LocationMapModal latitude={lat} longitude={lng} employeeName={selectedLocation.employeeName} timestamp={selectedLocation.timestamp} onClose={() => setSelectedLocation(null)} />;
    })()}
    </div>;
};
export default LivePunchMonitor;
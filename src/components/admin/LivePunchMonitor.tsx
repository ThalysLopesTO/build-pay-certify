import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Calendar } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useRealtime } from '@/contexts/RealtimeProvider';
import { useToast } from '@/hooks/use-toast';
import { format, isToday } from 'date-fns';
import LocationMapModal from './LocationMapModal';
import EditPunchModal from './timesheets/EditPunchModal';
import LivePunchFilters from './live-punch-monitor/LivePunchFilters';
import LivePunchSummaryCards from './live-punch-monitor/LivePunchSummaryCards';
import LivePunchTable from './live-punch-monitor/LivePunchTable';
import { useDeleteTimesheet } from '@/hooks/useDeleteTimesheet';
import DashboardHeader from '@/components/common/DashboardHeader';
import Papa from 'papaparse';
import { useSearchParams } from 'react-router-dom';
interface PunchEntry {
  id: string;
  user_id: string;
  jobsite_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  work_note: string | null;
  status: string;
  user_profiles: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null;
  jobsites: {
    name: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
}
const LivePunchMonitor = () => {
  const supabase = getSupabase();
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteTimesheet = useDeleteTimesheet();
  const [selectedJobsite, setSelectedJobsite] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [noteFilter, setNoteFilter] = useState<string>('all');
  // Initialize with today's date to ensure managers see today's punches by default
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [flaggedEntries, setFlaggedEntries] = useState<Set<string>>(new Set());
  const [editingTimesheet, setEditingTimesheet] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    punchLocation: string | null;
    employeeName: string;
    timestamp: string;
    jobsiteName?: string;
    jobsiteLatitude?: number;
    jobsiteLongitude?: number;
    photoUrl?: string;
    employeePunches: Array<{
      id: string;
      latitude: number;
      longitude: number;
      timestamp: string;
      employeeName: string;
      photoUrl?: string;
    }>;
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Initialize from URL params
    const dateParam = searchParams.get('date');
    const jobsiteParam = searchParams.get('jobsite');
    const employeeParam = searchParams.get('employee');
    const statusParam = searchParams.get('status');
    const noteParam = searchParams.get('note');
    const pageParam = searchParams.get('page');

    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) setSelectedDate(parsed);
    }
    if (jobsiteParam) setSelectedJobsite(jobsiteParam);
    if (employeeParam) setSelectedEmployee(employeeParam);
    if (statusParam) setStatusFilter(statusParam);
    if (noteParam) setNoteFilter(noteParam);
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) setCurrentPage(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (selectedDate) {
      params.set("date", format(selectedDate, "yyyy-MM-dd"));
    } else {
      params.delete("date");
    }

    if (selectedJobsite !== "all") {
      params.set("jobsite", selectedJobsite);
    } else {
      params.delete("jobsite");
    }

    if (selectedEmployee !== "all") {
      params.set("employee", selectedEmployee);
    } else {
      params.delete("employee");
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }

    if (noteFilter !== "all") {
      params.set("note", noteFilter);
    } else {
      params.delete("note");
    }

    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    } else {
      params.delete("page");
    }

    setSearchParams(params, { replace: true });
  }, [
    searchParams,
    selectedDate,
    selectedJobsite,
    selectedEmployee,
    statusFilter,
    noteFilter,
    currentPage,
    setSearchParams,
  ]);


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
          work_note,
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

      // Apply date filter - always filter by selected date (which defaults to today)
      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Handle overnight shifts: return entries where check_in <= endOfDay AND (check_out IS NULL OR check_out >= startOfDay)
        // This covers: 
        // 1. Normal same-day shifts (check_in and check_out both within the day)
        // 2. Active punches (check_out is null but checked in today)
        // 3. Overnight shifts (started today but ended next day, or started yesterday but ended today)
        query = query.or(
          `and(check_in_time.gte.${startOfDay.toISOString()},check_in_time.lte.${endOfDay.toISOString()}),` +
          `and(check_out_time.gte.${startOfDay.toISOString()},check_out_time.lte.${endOfDay.toISOString()}),` +
          `and(created_at.gte.${startOfDay.toISOString()},created_at.lte.${endOfDay.toISOString()})`
        );
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
      } = await supabase.from('user_profiles').select('user_id, first_name, last_name, photo_url').in('user_id', userIds);
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
            last_name: userProfile.last_name || '',
            photo_url: userProfile.photo_url || null
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
    staleTime: 30 * 1000, // 30 seconds for live data
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  // Set up realtime subscription for live updates
  useEffect(() => {
    if (!user?.companyId || !isToday(selectedDate)) {
      return; // Only subscribe to realtime for today's data
    }

    console.log('🔌 Setting up realtime subscription for timesheets');

    let unsubscribeFn: (() => void) | null = null;

    const setupSubscription = async () => {
      unsubscribeFn = await subscribe(
        'timesheets_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timesheets',
          filter: `company_id=eq.${user.companyId}`,
        },
        (payload) => {
          console.log('📡 Realtime timesheet update:', payload);

          // Invalidate and refetch the current query
          queryClient.invalidateQueries({
            queryKey: ['live-punch-monitor', user?.companyId]
          });
        }
      );
    };

    setupSubscription();

    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [user?.companyId, selectedDate, subscribe, queryClient]);
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
    const photoUrl = entry.user_profiles?.photo_url ?? undefined;
    
    // Get all punches for this employee on the selected date
    const employeePunches = (punchEntries || [])
      .filter(e => e.user_id === entry.user_id)
      .map(e => {
        const [lat, lng] = e.check_in_location?.split(',').map(Number) ?? [0, 0];
        return {
          id: e.id,
          latitude: lat,
          longitude: lng,
          timestamp: e.check_in_time || '',
          employeeName: e.user_profiles ? `${e.user_profiles.first_name} ${e.user_profiles.last_name}` : '',
          photoUrl: e.user_profiles?.photo_url ?? undefined,
        };
      })
      .filter(p => p.latitude && p.longitude);

    setSelectedLocation({
      punchLocation: entry.check_in_location,
      employeeName,
      timestamp,
      jobsiteName: entry.jobsites?.name,
      jobsiteLatitude: entry.jobsites?.latitude ?? undefined,
      jobsiteLongitude: entry.jobsites?.longitude ?? undefined,
      photoUrl,
      employeePunches,
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

  // Handle page changes and reset to page 1 when filters change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Punch data has been updated."
    });
  };

  const handleExportCsv = () => {
    const rows = filteredEntries.map((entry) => {
      const employeeName = entry.user_profiles ? `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : '';
      const jobsiteName = entry.jobsites?.name || '';
      const checkIn = entry.check_in_time ? format(new Date(entry.check_in_time), 'yyyy-MM-dd HH:mm') : '';
      const checkOut = entry.check_out_time ? format(new Date(entry.check_out_time), 'yyyy-MM-dd HH:mm') : '';
      const totalMs = entry.check_in_time ? ((entry.check_out_time ? new Date(entry.check_out_time).getTime() : Date.now()) - new Date(entry.check_in_time).getTime()) : 0;
      const hours = Math.floor(totalMs / (1000 * 60 * 60));
      const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      const totalTime = `${hours}h ${minutes}m`;
      const status = entry.check_out_time ? 'OUT' : 'IN';
      return {
        Employee: employeeName,
        Jobsite: jobsiteName,
        'Check-in': checkIn,
        'Check-out': checkOut,
        'Total Time': totalTime,
        Status: status,
        'Work Note': entry.work_note || '',
        'Check-in Location': entry.check_in_location || '',
        'Check-out Location': entry.check_out_location || '',
      };
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `live-punch-monitor-${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'all-dates'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setSelectedDate(new Date());
    setSelectedJobsite('all');
    setSelectedEmployee('all');
    setStatusFilter('all');
    setCurrentPage(1); // Reset to first page when clearing filters
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
    <DashboardHeader
      title="Live Punch Monitor"
      subtitle="Real-time tracking of employee punches at assigned jobsites"
      live
      isRefreshing={isLoading}
      onRefresh={handleRefresh}
      onExportCsv={handleExportCsv}
    />

    {/* KPI Cards */}
    <LivePunchSummaryCards filteredEntries={filteredEntries} selectedDate={selectedDate} />

    {/* Modern Filter Panel */}
    <Card className="shadow-sm border-accent/20">
      <CardContent className="p-6">

        <LivePunchFilters selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedJobsite={selectedJobsite} setSelectedJobsite={setSelectedJobsite} selectedEmployee={selectedEmployee} setSelectedEmployee={setSelectedEmployee} statusFilter={statusFilter} setStatusFilter={setStatusFilter} jobsites={jobsites} onClearFilters={handleClearFilters} hasActiveFilters={hasActiveFilters()} />
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
        <LivePunchTable
          filteredEntries={paginatedEntries}
          selectedDate={selectedDate}
          flaggedEntries={flaggedEntries}
          onToggleFlag={toggleFlag}
          onViewLocation={handleViewLocation}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEntries.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>

    {/* Edit Punch Modal */}
    {editingTimesheet && <EditPunchModal isOpen={!!editingTimesheet} onClose={() => setEditingTimesheet(null)} timesheet={editingTimesheet} onSuccess={() => refetch()} />}

    {/* Location Map Modal */}
    {selectedLocation && (() => {
      const [lat, lng] = selectedLocation.punchLocation?.split(',').map(Number) ?? [0, 0];
      return (
        <LocationMapModal
          latitude={lat}
          longitude={lng}
          employeeName={selectedLocation.employeeName}
          timestamp={selectedLocation.timestamp}
          jobsiteName={selectedLocation.jobsiteName}
          jobsiteLatitude={selectedLocation.jobsiteLatitude}
          jobsiteLongitude={selectedLocation.jobsiteLongitude}
          photoUrl={selectedLocation.photoUrl}
          employeePunches={selectedLocation.employeePunches}
          onClose={() => setSelectedLocation(null)}
        />
      );
    })()}
  </div>;
};
export default LivePunchMonitor;
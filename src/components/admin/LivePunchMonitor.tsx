import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, User, MapPin, Filter, RefreshCw, Calendar, Flag } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PunchEntry {
  id: string;
  user_id: string;
  jobsite_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
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
  const [selectedJobsite, setSelectedJobsite] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [flaggedEntries, setFlaggedEntries] = useState<Set<string>>(new Set());

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

  const calculateTotalTime = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn) return '0h 0m';
    
    const startTime = new Date(checkIn);
    const endTime = checkOut ? new Date(checkOut) : new Date();
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (entry: PunchEntry) => {
    if (!entry.check_out_time) {
      return <Badge variant="default" className="bg-green-500">Clocked In</Badge>;
    } else {
      return <Badge variant="secondary">Clocked Out</Badge>;
    }
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

  const formatEmployeeNameWithDate = (entry: PunchEntry) => {
    const employeeName = entry.user_profiles ? 
      `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 
      'Unknown Employee';
    
    if (entry.check_in_time) {
      const checkInDate = new Date(entry.check_in_time);
      const dayDate = format(checkInDate, 'EEE, MMM dd');
      return `${dayDate} – ${employeeName}`;
    }
    
    return employeeName;
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
              ? `Real-time monitoring of employee check-ins and check-outs for ${format(selectedDate, 'EEEE, MMMM dd, yyyy')}`
              : `Employee punch entries for ${format(selectedDate, 'EEEE, MMMM dd, yyyy')}`
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMM dd, yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Jobsite</label>
              <Select value={selectedJobsite} onValueChange={setSelectedJobsite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select jobsite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobsites</SelectItem>
                  {jobsites?.map((jobsite) => (
                    <SelectItem key={jobsite.id} value={jobsite.id}>
                      {jobsite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Clocked In</SelectItem>
                  <SelectItem value="completed">Clocked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {isToday(selectedDate) ? 'Currently Clocked In' : 'Were Clocked In'}
                </p>
                <p className="text-2xl font-bold">
                  {filteredEntries.filter(e => !e.check_out_time).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Employees {isToday(selectedDate) ? 'Today' : 'That Day'}
                </p>
                <p className="text-2xl font-bold">{filteredEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Jobsites</p>
                <p className="text-2xl font-bold">
                  {new Set(filteredEntries.filter(e => !e.check_out_time).map(e => e.jobsite_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Punch Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isToday(selectedDate) ? "Today's Punch Entries" : `Punch Entries for ${format(selectedDate, 'MMM dd, yyyy')}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Jobsite</TableHead>
                <TableHead>Check-in Time</TableHead>
                <TableHead>Check-out Time</TableHead>
                <TableHead>Total Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No punch entries found for {format(selectedDate, 'MMMM dd, yyyy')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow 
                    key={entry.id}
                    className={flaggedEntries.has(entry.id) ? 'bg-red-50 border-l-4 border-l-red-500' : ''}
                  >
                    <TableCell className="font-medium">
                      {formatEmployeeNameWithDate(entry)}
                    </TableCell>
                    <TableCell>{entry.jobsites?.name || 'Unknown Jobsite'}</TableCell>
                    <TableCell>
                      {entry.check_in_time 
                        ? format(new Date(entry.check_in_time), 'h:mm a')
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {entry.check_out_time 
                        ? format(new Date(entry.check_out_time), 'h:mm a')
                        : 'Still active'
                      }
                    </TableCell>
                    <TableCell>
                      {calculateTotalTime(entry.check_in_time, entry.check_out_time)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(entry)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFlag(entry.id)}
                        className={cn(
                          "p-2 h-8 w-8",
                          flaggedEntries.has(entry.id) 
                            ? "text-red-600 hover:text-red-700" 
                            : "text-gray-400 hover:text-red-500"
                        )}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LivePunchMonitor;

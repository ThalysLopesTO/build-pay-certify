import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, User, MapPin, Filter, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

  // Fetch today's punch entries
  const { data: punchEntries, isLoading, refetch } = useQuery({
    queryKey: ['live-punch-monitor', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          id,
          user_id,
          jobsite_id,
          check_in_time,
          check_out_time,
          status,
          user_profiles!timesheets_user_id_fkey(first_name, last_name),
          jobsites!timesheets_jobsite_id_fkey(name)
        `)
        .eq('company_id', user.companyId)
        .gte('check_in_time', today.toISOString())
        .lt('check_in_time', tomorrow.toISOString())
        .order('check_in_time', { ascending: false });

      if (error) {
        console.error('Error fetching punch entries:', error);
        throw error;
      }

      return data as PunchEntry[];
    },
    enabled: !!user?.companyId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

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
          <p className="text-muted-foreground">Real-time monitoring of employee check-ins and check-outs for today</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-sm text-muted-foreground">Currently Clocked In</p>
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
                <p className="text-sm text-muted-foreground">Total Employees Today</p>
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
          <CardTitle>Today's Punch Entries</CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No punch entries found for today
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.user_profiles ? 
                        `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 
                        'Unknown Employee'
                      }
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

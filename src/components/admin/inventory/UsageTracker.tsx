import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEquipmentUsage } from '@/hooks/useEquipmentUsage';
import { AssignToolModal } from './usage/AssignToolModal';
import { ReturnToolModal } from './usage/ReturnToolModal';
import { EquipmentHistoryDrawer } from './usage/EquipmentHistoryDrawer';
import { UsageFilters, EquipmentUsageLog } from '@/types/equipment-usage';
import { format } from 'date-fns';
import { Search, Plus, Download, Clock, TrendingUp, AlertCircle, Package, History, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in_use': return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'returned': return 'bg-green-500/10 text-green-700 border-green-200';
    case 'damaged': return 'bg-orange-500/10 text-orange-700 border-orange-200';
    case 'lost': return 'bg-red-500/10 text-red-700 border-red-200';
    default: return 'bg-muted text-muted-foreground';
  }
};

const calculateDuration = (start: string, end: string | null) => {
  if (!end) return 'In Use';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const UsageTracker = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<UsageFilters>({
    status: 'all',
    search: '',
  });
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedUsage, setSelectedUsage] = useState<EquipmentUsageLog | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<{ id: string; name: string } | null>(null);

  const { usageLogs, stats, isLoading, isAssigning, isReturning, assignEquipment, returnEquipment, getEquipmentHistory } = useEquipmentUsage(filters);

  const { data: jobsites } = useQuery({
    queryKey: ['jobsites', user?.companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobsites')
        .select('id, name')
        .eq('company_id', user?.companyId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-filter', user?.companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .eq('company_id', user?.companyId)
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId,
  });

  const handleExportCSV = () => {
    const csv = Papa.unparse(usageLogs.map(log => ({
      Equipment: log.equipment?.equipment_name,
      Brand: log.equipment?.brand,
      SKU: log.equipment?.sku,
      Employee: `${log.employee?.first_name} ${log.employee?.last_name}`,
      Jobsite: log.jobsite?.name,
      'Start Time': format(new Date(log.start_time), 'yyyy-MM-dd HH:mm'),
      'Return Time': log.return_time ? format(new Date(log.return_time), 'yyyy-MM-dd HH:mm') : 'N/A',
      Duration: calculateDuration(log.start_time, log.return_time),
      Status: log.status,
      Notes: log.notes || '',
    })));

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment-usage-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const canManage = user?.role && ['admin', 'super_admin', 'management', 'foreman'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Currently Assigned</p>
                <p className="text-3xl font-bold">{stats?.currently_assigned || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Returned Today</p>
                <p className="text-3xl font-bold">{stats?.returned_today || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Return</p>
                <p className="text-3xl font-bold">{stats?.pending_return || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Damaged/Lost Today</p>
                <p className="text-3xl font-bold">{stats?.damaged_lost_today || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment, employee, or jobsite..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>

            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v as any })}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_use">In Use</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.jobsite_id || 'all'} onValueChange={(v) => setFilters({ ...filters, jobsite_id: v === 'all' ? undefined : v })}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Jobsites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobsites</SelectItem>
                {jobsites?.map((site) => (
                  <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.employee_id || 'all'} onValueChange={(v) => setFilters({ ...filters, employee_id: v === 'all' ? undefined : v })}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees?.map((emp) => (
                  <SelectItem key={emp.user_id} value={emp.user_id}>
                    {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              {canManage && (
                <Button onClick={() => setAssignModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Tool
                </Button>
              )}
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Jobsite</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Return Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : usageLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No usage logs found</p>
                      {canManage && (
                        <Button onClick={() => setAssignModalOpen(true)} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Assign Your First Tool
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                usageLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.equipment?.equipment_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.equipment?.brand} • {log.equipment?.sku}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.employee?.photo_url || ''} />
                          <AvatarFallback>
                            {log.employee?.first_name?.[0]}{log.employee?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {log.employee?.first_name} {log.employee?.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.jobsite?.name}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(log.start_time), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.return_time ? format(new Date(log.return_time), 'MMM d, h:mm a') : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {calculateDuration(log.start_time, log.return_time)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(log.status)}>
                        {log.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManage && log.status === 'in_use' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUsage(log);
                              setReturnModalOpen(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Return
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedEquipment({
                              id: log.equipment_id,
                              name: log.equipment?.equipment_name || 'Equipment',
                            });
                            setHistoryDrawerOpen(true);
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <AssignToolModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        onAssign={async (data) => {
          await assignEquipment(data);
          setAssignModalOpen(false);
        }}
        isAssigning={isAssigning}
      />

      <ReturnToolModal
        open={returnModalOpen}
        onOpenChange={setReturnModalOpen}
        usageLog={selectedUsage}
        onReturn={returnEquipment}
        isReturning={isReturning}
      />

      <EquipmentHistoryDrawer
        open={historyDrawerOpen}
        onOpenChange={setHistoryDrawerOpen}
        equipmentId={selectedEquipment?.id || null}
        equipmentName={selectedEquipment?.name || ''}
        getHistory={getEquipmentHistory}
      />
    </div>
  );
};

export default UsageTracker;

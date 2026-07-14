import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useInventory } from '@/hooks/useInventory';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfilesByUserIds } from '@/lib/users/fetchProfiles';
import { Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { fromCompanyTimezone } from '@/utils/timezone';

interface AssignToolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (data: {
    equipment_id: string;
    employee_id: string;
    jobsite_id: string;
    start_time?: string;
    notes?: string;
  }) => void;
  isAssigning: boolean;
}

export const AssignToolModal: React.FC<AssignToolModalProps> = ({
  open,
  onOpenChange,
  onAssign,
  isAssigning,
}) => {
  const { user } = useAuth();
  const { settings: companySettings } = useCompanySettings();
  const { inventory } = useInventory();
  const [jobsiteId, setJobsiteId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');

  // Handler for jobsite change - clear equipment when jobsite changes
  const handleJobsiteChange = (value: string) => {
    setJobsiteId(value);
    setEquipmentId(''); // Clear equipment selection when jobsite changes
  };

  // Fetch employees using existing hook (includes photo_url)
  const { data: employeesData, isLoading: isLoadingEmployees, error: employeesError } = useEmployeeDirectory();

  const employees = Array.isArray(employeesData) ? employeesData : [];

  const { data: jobsitesData, isLoading: isLoadingJobsites, error: jobsitesError } = useQuery({
    queryKey: ['jobsites', user?.companyId],
    queryFn: async () => {
      console.log('Fetching jobsites for company:', user?.companyId);
      const { data, error } = await supabase
        .from('jobsites')
        .select('id, name')
        .eq('company_id', user?.companyId)
        .order('name');
      
      if (error) {
        console.error('Error fetching jobsites:', error);
        throw error;
      }
      console.log('Jobsites fetched:', data?.length || 0, 'records');
      return data || [];
    },
    enabled: !!user?.companyId && open,
  });

  const jobsites = Array.isArray(jobsitesData) ? jobsitesData : [];

  // Fetch equipment usage status to show which are assigned
  const { data: equipmentUsageData } = useQuery({
    queryKey: ['active-equipment-assignments', user?.companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_usage_log')
        .select('equipment_id, employee_id')
        .eq('company_id', user?.companyId)
        .eq('status', 'in_use');

      if (error) throw error;
      const map = await fetchProfilesByUserIds((data || []).map((u: any) => u.employee_id));
      return (data || []).map((u: any) => ({
        ...u,
        employee: u.employee_id && map[u.employee_id]
          ? { first_name: map[u.employee_id].first_name, last_name: map[u.employee_id].last_name }
          : null,
      }));
    },
    enabled: !!user?.companyId && open,
  });

  // Create a map of equipment_id -> employee name for in-use equipment
  const equipmentAssignments = new Map(
    (equipmentUsageData || []).map((usage: any) => [
      usage.equipment_id,
      usage.employee ? `${usage.employee.first_name} ${usage.employee.last_name}` : 'Unknown'
    ])
  );

  // Filter inventory by selected jobsite and include usage status
  const availableEquipment = Array.isArray(inventory) 
    ? inventory
        .filter(item => !jobsiteId || item.jobsite_id === jobsiteId)
        .map(item => ({
          ...item,
          isAssigned: equipmentAssignments.has(item.id),
          assignedTo: equipmentAssignments.get(item.id)
        }))
    : [];

  console.log('Available equipment for jobsite:', jobsiteId || 'none selected', availableEquipment.length);
  console.log('User company ID:', user?.companyId);

  const isLoadingData = isLoadingEmployees || isLoadingJobsites;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert datetime-local value to proper UTC timestamp
    let finalStartTime: string | undefined = undefined;
    
    if (startTime) {
      // Parse the datetime-local value (format: "2025-11-02T07:00")
      const localDate = new Date(startTime);
      
      // Convert from company timezone to UTC for storage
      const timezone = companySettings?.timezone || 'America/Toronto';
      const utcDate = fromCompanyTimezone(localDate, timezone);
      finalStartTime = utcDate.toISOString();
    }
    
    onAssign({
      equipment_id: equipmentId,
      employee_id: employeeId,
      jobsite_id: jobsiteId,
      start_time: finalStartTime,
      notes: notes || undefined,
    });
    
    setJobsiteId('');
    setEquipmentId('');
    setEmployeeId('');
    setStartTime('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Jobsite Select - FIRST */}
            <div className="space-y-2">
              <Label htmlFor="jobsite">Jobsite * {!isLoadingData && `(${jobsites.length} sites)`}</Label>
              <Select value={jobsiteId} onValueChange={handleJobsiteChange} required disabled={isLoadingData}>
                <SelectTrigger id="jobsite">
                  <SelectValue placeholder={isLoadingData ? "Loading jobsites..." : "Select jobsite first"} />
                </SelectTrigger>
                <SelectContent>
                  {jobsitesError ? (
                    <div className="px-2 py-6 text-center text-sm text-destructive">
                      Error loading jobsites
                    </div>
                  ) : jobsites.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No jobsites available
                    </div>
                  ) : (
                    jobsites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment Select - SECOND (filtered by jobsite) */}
            <div className="space-y-2">
              <Label htmlFor="equipment">
                Equipment * 
                {jobsiteId && !isLoadingData && ` (${availableEquipment.length} available at this site)`}
              </Label>
              <Select value={equipmentId} onValueChange={setEquipmentId} required disabled={isLoadingData || !jobsiteId}>
                <SelectTrigger id="equipment">
                  <SelectValue placeholder={
                    isLoadingData ? "Loading equipment..." : 
                    !jobsiteId ? "First select a jobsite" : 
                    "Select equipment from this site"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {!jobsiteId ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      Please select a jobsite first
                    </div>
                  ) : availableEquipment.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No available equipment at this jobsite
                    </div>
                  ) : (
                    availableEquipment.map((item) => (
                      <SelectItem 
                        key={item.id} 
                        value={item.id}
                        disabled={item.isAssigned}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{item.equipment_name} - {item.brand} ({item.sku})</span>
                          {item.isAssigned && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              In Use by {item.assignedTo}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Employee Select - THIRD */}
            <div className="space-y-2">
              <Label htmlFor="employee">Assigned To * {!isLoadingData && `(${employees.length} employees)`}</Label>
              <Select value={employeeId} onValueChange={setEmployeeId} required disabled={isLoadingData}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder={isLoadingData ? "Loading employees..." : "Select employee"} />
                </SelectTrigger>
                <SelectContent>
                  {employeesError ? (
                    <div className="px-2 py-6 text-center text-sm text-destructive">
                      Error loading employees
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No active employees found
                    </div>
                  ) : (
                    employees.map((emp) => (
                      <SelectItem key={emp.user_id} value={emp.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={emp.photo_url || undefined} alt={`${emp.first_name} ${emp.last_name}`} />
                            <AvatarFallback className="text-xs">
                              {emp.first_name?.[0]}{emp.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{emp.first_name} {emp.last_name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time
                {companySettings?.timezone && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({companySettings.timezone})
                  </span>
                )}
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="Leave empty for current time"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use current time
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isAssigning || isLoadingData}>
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Equipment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

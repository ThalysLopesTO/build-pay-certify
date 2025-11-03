import React, { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { fromCompanyTimezone, toCompanyTimezone } from '@/utils/timezone';
import { EquipmentUsageLog } from '@/types/equipment-usage';

interface EditToolAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usageLog: EquipmentUsageLog | null;
  onUpdate: (id: string, updates: {
    equipment_id: string;
    employee_id: string;
    jobsite_id: string;
    start_time?: string;
    notes?: string;
  }) => Promise<void>;
  isUpdating: boolean;
}

export const EditToolAssignmentModal: React.FC<EditToolAssignmentModalProps> = ({
  open,
  onOpenChange,
  usageLog,
  onUpdate,
  isUpdating,
}) => {
  const { user } = useAuth();
  const { settings: companySettings } = useCompanySettings();
  const { inventory } = useInventory();
  const [jobsiteId, setJobsiteId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');

  // Populate form when usageLog changes
  useEffect(() => {
    if (usageLog && open) {
      setJobsiteId(usageLog.jobsite_id);
      setEquipmentId(usageLog.equipment_id);
      setEmployeeId(usageLog.employee_id);
      setNotes(usageLog.notes || '');
      
      // Convert UTC start_time to company timezone for display
      if (usageLog.start_time) {
        const utcDate = new Date(usageLog.start_time);
        const timezone = companySettings?.timezone || 'America/Toronto';
        const localDate = toCompanyTimezone(utcDate, timezone);
        
        // Format for datetime-local input (YYYY-MM-DDTHH:mm)
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const hours = String(localDate.getHours()).padStart(2, '0');
        const minutes = String(localDate.getMinutes()).padStart(2, '0');
        const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        setStartTime(formattedDateTime);
      }
    }
  }, [usageLog, open, companySettings?.timezone]);

  const handleJobsiteChange = (value: string) => {
    setJobsiteId(value);
    // Don't clear equipment when editing - let user keep it if they want
  };

  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployeeDirectory();
  const employees = Array.isArray(employeesData) ? employeesData : [];

  const { data: jobsitesData, isLoading: isLoadingJobsites } = useQuery({
    queryKey: ['jobsites', user?.companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobsites')
        .select('id, name')
        .eq('company_id', user?.companyId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.companyId && open,
  });

  const jobsites = Array.isArray(jobsitesData) ? jobsitesData : [];

  // Fetch equipment usage status
  const { data: equipmentUsageData } = useQuery({
    queryKey: ['active-equipment-assignments', user?.companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_usage_log')
        .select('equipment_id, id, employee:user_profiles!employee_id(first_name, last_name)')
        .eq('company_id', user?.companyId)
        .eq('status', 'in_use')
        .neq('id', usageLog?.id || ''); // Exclude current log
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.companyId && open && !!usageLog,
  });

  const equipmentAssignments = new Map(
    (equipmentUsageData || []).map((usage: any) => [
      usage.equipment_id,
      usage.employee ? `${usage.employee.first_name} ${usage.employee.last_name}` : 'Unknown'
    ])
  );

  const availableEquipment = Array.isArray(inventory) 
    ? inventory
        .filter(item => !jobsiteId || item.jobsite_id === jobsiteId)
        .map(item => ({
          ...item,
          isAssigned: equipmentAssignments.has(item.id),
          assignedTo: equipmentAssignments.get(item.id)
        }))
    : [];

  const isLoadingData = isLoadingEmployees || isLoadingJobsites;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usageLog) return;
    
    let finalStartTime: string | undefined = undefined;
    
    if (startTime) {
      const localDate = new Date(startTime);
      const timezone = companySettings?.timezone || 'America/Toronto';
      const utcDate = fromCompanyTimezone(localDate, timezone);
      finalStartTime = utcDate.toISOString();
    }
    
    await onUpdate(usageLog.id, {
      equipment_id: equipmentId,
      employee_id: employeeId,
      jobsite_id: jobsiteId,
      start_time: finalStartTime,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Equipment Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Jobsite Select */}
            <div className="space-y-2">
              <Label htmlFor="jobsite">Jobsite * {!isLoadingData && `(${jobsites.length} sites)`}</Label>
              <Select value={jobsiteId} onValueChange={handleJobsiteChange} required disabled={isLoadingData}>
                <SelectTrigger id="jobsite">
                  <SelectValue placeholder={isLoadingData ? "Loading jobsites..." : "Select jobsite"} />
                </SelectTrigger>
                <SelectContent>
                  {jobsites.length === 0 ? (
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

            {/* Equipment Select */}
            <div className="space-y-2">
              <Label htmlFor="equipment">
                Equipment * 
                {jobsiteId && !isLoadingData && ` (${availableEquipment.length} at this site)`}
              </Label>
              <Select value={equipmentId} onValueChange={setEquipmentId} required disabled={isLoadingData || !jobsiteId}>
                <SelectTrigger id="equipment">
                  <SelectValue placeholder={
                    isLoadingData ? "Loading equipment..." : 
                    !jobsiteId ? "First select a jobsite" : 
                    "Select equipment"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {!jobsiteId ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      Please select a jobsite first
                    </div>
                  ) : availableEquipment.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No equipment at this jobsite
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

            {/* Employee Select */}
            <div className="space-y-2">
              <Label htmlFor="employee">Assigned To * {!isLoadingData && `(${employees.length} employees)`}</Label>
              <Select value={employeeId} onValueChange={setEmployeeId} required disabled={isLoadingData}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder={isLoadingData ? "Loading employees..." : "Select employee"} />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
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

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time *
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
                required
              />
            </div>

            {/* Notes */}
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
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || isLoadingData}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

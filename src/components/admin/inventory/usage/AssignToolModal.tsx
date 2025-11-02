import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useInventory } from '@/hooks/useInventory';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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
  const { inventory } = useInventory();
  const [equipmentId, setEquipmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [jobsiteId, setJobsiteId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');

  const { data: employeesData, isLoading: isLoadingEmployees, error: employeesError } = useQuery({
    queryKey: ['employees', user?.companyId],
    queryFn: async () => {
      console.log('Fetching employees for company:', user?.companyId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .eq('company_id', user?.companyId)
        .eq('is_active', true)
        .order('first_name');
      
      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      console.log('Employees fetched:', data?.length || 0, 'records');
      return data || [];
    },
    enabled: !!user?.companyId && open,
  });

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

  // Query to get equipment that's currently in use
  const { data: activeAssignments, isLoading: isLoadingActiveAssignments } = useQuery({
    queryKey: ['active-equipment-assignments', user?.companyId],
    queryFn: async () => {
      console.log('Fetching active equipment assignments for company:', user?.companyId);
      const { data, error } = await supabase
        .from('equipment_usage_log')
        .select('equipment_id')
        .eq('company_id', user?.companyId)
        .eq('status', 'in_use');
      
      if (error) {
        console.error('Error fetching active assignments:', error);
        throw error;
      }
      const assignedIds = data?.map(a => a.equipment_id) || [];
      console.log('Equipment currently in use:', assignedIds.length, 'items');
      return assignedIds;
    },
    enabled: !!user?.companyId && open,
  });

  // Filter inventory to show only available equipment (not currently in use)
  const availableEquipment = Array.isArray(inventory) 
    ? inventory.filter(item => !activeAssignments?.includes(item.id))
    : [];

  console.log('Available equipment count:', availableEquipment.length);
  console.log('User company ID:', user?.companyId);

  const isLoadingData = isLoadingEmployees || isLoadingJobsites || isLoadingActiveAssignments;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign({
      equipment_id: equipmentId,
      employee_id: employeeId,
      jobsite_id: jobsiteId,
      start_time: startTime || undefined,
      notes: notes || undefined,
    });
    
    setEquipmentId('');
    setEmployeeId('');
    setJobsiteId('');
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
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment * {!isLoadingData && `(${availableEquipment.length} available)`}</Label>
              <Select value={equipmentId} onValueChange={setEquipmentId} required disabled={isLoadingData}>
                <SelectTrigger id="equipment">
                  <SelectValue placeholder={isLoadingData ? "Loading equipment..." : "Select equipment"} />
                </SelectTrigger>
                <SelectContent>
                  {availableEquipment.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No available equipment found
                    </div>
                  ) : (
                    availableEquipment.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.equipment_name} - {item.brand} ({item.sku})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

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
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobsite">Jobsite * {!isLoadingData && `(${jobsites.length} sites)`}</Label>
              <Select value={jobsiteId} onValueChange={setJobsiteId} required disabled={isLoadingData}>
                <SelectTrigger id="jobsite">
                  <SelectValue placeholder={isLoadingData ? "Loading jobsites..." : "Select jobsite"} />
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

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="Leave empty for current time"
              />
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

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

  const { data: employees } = useQuery({
    queryKey: ['employees', user?.companyId],
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
    enabled: !!user?.companyId && open,
  });

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
    enabled: !!user?.companyId && open,
  });

  const availableEquipment = inventory.filter(item => !item.jobsite_id || item.return_date);

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
              <Label htmlFor="equipment">Equipment *</Label>
              <Select value={equipmentId} onValueChange={setEquipmentId} required>
                <SelectTrigger id="equipment">
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {availableEquipment.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.equipment_name} - {item.brand} ({item.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Assigned To *</Label>
              <Select value={employeeId} onValueChange={setEmployeeId} required>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.user_id} value={emp.user_id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobsite">Jobsite *</Label>
              <Select value={jobsiteId} onValueChange={setJobsiteId} required>
                <SelectTrigger id="jobsite">
                  <SelectValue placeholder="Select jobsite" />
                </SelectTrigger>
                <SelectContent>
                  {jobsites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
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
            <Button type="submit" disabled={isAssigning}>
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Equipment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

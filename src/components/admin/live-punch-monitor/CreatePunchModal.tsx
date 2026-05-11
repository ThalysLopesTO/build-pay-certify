import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface EmployeeOption {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}
interface JobsiteOption {
  id: string;
  name: string;
}

interface CreatePunchModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employees: EmployeeOption[] | undefined;
  jobsites: JobsiteOption[] | undefined;
  defaultDate: Date | null;
}

const toLocalIso = (dateStr: string, timeStr: string) => {
  // Build local timestamp, then convert to ISO (UTC) for storage
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0).toISOString();
};

const CreatePunchModal: React.FC<CreatePunchModalProps> = ({
  open,
  onOpenChange,
  employees,
  jobsites,
  defaultDate,
}) => {
  const supabase = getSupabase();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [employeeId, setEmployeeId] = useState<string>('');
  const [jobsiteId, setJobsiteId] = useState<string>('');
  const [date, setDate] = useState<string>(format(defaultDate ?? new Date(), 'yyyy-MM-dd'));
  const [checkInTime, setCheckInTime] = useState<string>('08:00');
  const [checkOutTime, setCheckOutTime] = useState<string>('');
  const [breakMinutes, setBreakMinutes] = useState<string>('0');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (open) {
      setEmployeeId('');
      setJobsiteId('');
      setDate(format(defaultDate ?? new Date(), 'yyyy-MM-dd'));
      setCheckInTime('08:00');
      setCheckOutTime('');
      setBreakMinutes('0');
      setNote('');
    }
  }, [open, defaultDate]);

  const createPunch = useMutation({
    mutationFn: async () => {
      if (!user?.companyId) throw new Error('Missing company');
      if (!employeeId) throw new Error('Please select an employee');
      if (!jobsiteId) throw new Error('Please select a jobsite');
      if (!date || !checkInTime) throw new Error('Date and check-in time are required');

      const checkInIso = toLocalIso(date, checkInTime);
      const checkOutIso = checkOutTime ? toLocalIso(date, checkOutTime) : null;

      if (checkOutIso && new Date(checkOutIso) <= new Date(checkInIso)) {
        throw new Error('Check-out must be after check-in');
      }

      const finalNote = note.trim()
        ? `[Manually added by admin] ${note.trim()}`
        : '[Manually added by admin]';

      const payload: Record<string, any> = {
        company_id: user.companyId,
        user_id: employeeId,
        jobsite_id: jobsiteId,
        check_in_time: checkInIso,
        check_out_time: checkOutIso,
        break_minutes: checkOutIso ? Number(breakMinutes) || 0 : null,
        work_note: finalNote,
        status: checkOutIso ? 'completed' : 'active',
        manual_override: true,
        manual_override_by: user.id,
        manual_override_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('timesheets')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Punch created', description: 'The punch entry has been added.' });
      queryClient.invalidateQueries({ queryKey: ['live-punch-monitor'] });
      queryClient.invalidateQueries({ queryKey: ['daily-hours-summary'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: 'Could not create punch',
        description: err?.message ?? 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Create Punch for Employee
          </DialogTitle>
          <DialogDescription>
            Manually record a punch for any employee on any date. Useful for missed clock-ins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {(Array.isArray(employees) ? employees : []).map((e) => (
                  <SelectItem key={e.user_id} value={e.user_id}>
                    {(e.first_name ?? '') + ' ' + (e.last_name ?? '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Jobsite</Label>
            <Select value={jobsiteId} onValueChange={setJobsiteId}>
              <SelectTrigger><SelectValue placeholder="Select jobsite" /></SelectTrigger>
              <SelectContent>
                {(Array.isArray(jobsites) ? jobsites : []).map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label>Check-in</Label>
              <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label>Check-out (optional)</Label>
              <Input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
            </div>
          </div>

          {checkOutTime && (
            <div className="space-y-1.5">
              <Label>Break minutes</Label>
              <Input
                type="number"
                min="0"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Work note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for manual entry, etc."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              "[Manually added by admin]" will be prepended automatically.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createPunch.isPending}>
            Cancel
          </Button>
          <Button onClick={() => createPunch.mutate()} disabled={createPunch.isPending}>
            {createPunch.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</>
            ) : (
              'Create punch'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePunchModal;

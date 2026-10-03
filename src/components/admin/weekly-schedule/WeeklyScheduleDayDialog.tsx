import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUpToLine, Trash2, Users, X } from 'lucide-react';

import type { WeeklyScheduleEntry } from '@/hooks/useWeeklySchedules';
import { emptyEntry } from '@/hooks/useWeeklySchedules';
import { formatDayLabel } from '@/utils/weeklyScheduleWeek';

/** Start time the office writes when the job is not locked in yet. */
export const TBC = 'To be confirmed';

export const SERVICE_SUGGESTIONS = [
  'Insurance',
  'Residential',
  'Commercial',
  'Deep Clean',
  'Post Construction',
  'Move In / Move Out',
];

export const employeeName = (emp: any): string =>
  `${emp?.first_name ?? ''} ${emp?.last_name ?? ''}`.trim() || emp?.email || 'Unknown';

const initials = (first?: string | null, last?: string | null) => {
  const f = (first ?? '').trim().charAt(0);
  const l = (last ?? '').trim().charAt(0);
  return (f + l).toUpperCase() || '?';
};

interface Props {
  open: boolean;
  entry: WeeklyScheduleEntry | null;
  /** The day above, for "copy previous day". Null on Monday. */
  previous: WeeklyScheduleEntry | null;
  employees: any[];
  clients: { id: string; client_name: string; client_address: string | null }[];
  onSave: (entry: WeeklyScheduleEntry) => void;
  onClose: () => void;
}

/**
 * The one editor for a day — identical on phone, tablet and desktop, which is
 * the point: the office fills the same form wherever they are.
 */
export const WeeklyScheduleDayDialog: React.FC<Props> = ({
  open,
  entry,
  previous,
  employees,
  clients,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<WeeklyScheduleEntry | null>(entry);

  // Reopen on another day → start from that day's values
  useEffect(() => setDraft(entry), [entry]);

  const clientsByName = useMemo(() => {
    const map = new Map<string, (typeof clients)[number]>();
    clients.forEach(c => map.set((c.client_name ?? '').trim().toLowerCase(), c));
    return map;
  }, [clients]);

  if (!draft) return null;

  const patch = (changes: Partial<WeeklyScheduleEntry>) =>
    setDraft(prev => (prev ? { ...prev, ...changes } : prev));

  const handleClientChange = (value: string) => {
    const match = clientsByName.get(value.trim().toLowerCase());
    patch({
      client_name: value,
      client_id: match?.id ?? null,
      address: match?.client_address && !draft.address.trim() ? match.client_address : draft.address,
    });
  };

  const toggleEmployee = (emp: any) => {
    const id = emp.user_id as string;
    const has = draft.employee_ids.includes(id);
    patch({
      employee_ids: has
        ? draft.employee_ids.filter(x => x !== id)
        : [...draft.employee_ids, id],
      employee_names: has
        ? draft.employee_names.filter(n => n !== employeeName(emp))
        : [...draft.employee_names, employeeName(emp)],
    });
  };

  const copyPrevious = () => {
    if (!previous) return;
    patch({
      client_name: previous.client_name,
      client_id: previous.client_id,
      start_time: previous.start_time,
      address: previous.address,
      service: previous.service,
      notes: previous.notes,
      employee_ids: [...previous.employee_ids],
      employee_names: [...previous.employee_names],
    });
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-4 py-3 text-left sm:px-6">
          <DialogTitle>{formatDayLabel(draft.date)}</DialogTitle>
          <DialogDescription>
            Everyone picked here sees this day in their app once the week is published.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          {previous && (
            <Button type="button" variant="outline" size="sm" onClick={copyPrevious}>
              <ArrowUpToLine className="mr-1.5 h-3.5 w-3.5" /> Copy the day before
            </Button>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="day-client">Client / job site</Label>
            <Input
              id="day-client"
              list="weekly-schedule-clients"
              value={draft.client_name}
              onChange={e => handleClientChange(e.target.value)}
              placeholder="Client or job site"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="day-time">Start time</Label>
              {draft.start_time === TBC ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-between font-normal"
                  onClick={() => patch({ start_time: '' })}
                >
                  To be confirmed <X className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="day-time"
                    type="time"
                    value={draft.start_time}
                    onChange={e => patch({ start_time: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 px-2 text-xs"
                    onClick={() => patch({ start_time: TBC })}
                  >
                    TBC
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="day-service">Service</Label>
              <Input
                id="day-service"
                list="weekly-schedule-services"
                value={draft.service}
                onChange={e => patch({ service: e.target.value })}
                placeholder="Insurance"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="day-address">Address</Label>
            <Input
              id="day-address"
              value={draft.address}
              onChange={e => patch({ address: e.target.value })}
              placeholder="Street, city"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              Who works this day
              {draft.employee_ids.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({draft.employee_ids.length} selected)
                </span>
              )}
            </Label>
            <div className="max-h-48 divide-y overflow-y-auto rounded-md border">
              {employees.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">No employees found.</p>
              )}
              {employees.map(emp => (
                <label
                  key={emp.user_id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={draft.employee_ids.includes(emp.user_id)}
                    onCheckedChange={() => toggleEmployee(emp)}
                  />
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={emp.photo_url ?? emp.profile_photo_url ?? undefined}
                      alt={employeeName(emp)}
                    />
                    <AvatarFallback className="text-[10px]">
                      {initials(emp.first_name, emp.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm">{employeeName(emp)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="day-notes">Notes</Label>
            <Textarea
              id="day-notes"
              value={draft.notes}
              onChange={e => patch({ notes: e.target.value })}
              rows={4}
              placeholder="Lockbox code, keys, parking, anything the crew needs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t px-4 py-3 sm:justify-between sm:px-6">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              onSave(emptyEntry(draft.date));
              onClose();
            }}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Clear day
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onSave(draft);
                onClose();
              }}
            >
              Save day
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyScheduleDayDialog;

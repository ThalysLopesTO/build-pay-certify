import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowUpToLine, Download, Loader2, Save, Send, X } from 'lucide-react';
import { toast } from 'sonner';

import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useClients } from '@/hooks/useClients';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import {
  buildWeekEntries,
  entryIsFilled,
  useWeeklySchedules,
  type WeeklySchedule,
  type WeeklyScheduleEntry,
} from '@/hooks/useWeeklySchedules';
import { formatDayLabel, formatWeekRange } from '@/utils/weeklyScheduleWeek';
import { generateWeeklySchedulePDF } from '@/utils/weeklySchedulePDF';

/** Start time the office writes when the job is not locked in yet. */
export const TBC = 'To be confirmed';

const SERVICE_SUGGESTIONS = [
  'Insurance',
  'Residential',
  'Commercial',
  'Deep Clean',
  'Post Construction',
  'Move In / Move Out',
];

const TEAM_OPTION = '__team__';

interface Props {
  /** Existing schedule to edit, or null for a new one. */
  schedule?: WeeklySchedule | null;
  weekStart: string;
  onDone: () => void;
}

export const WeeklyScheduleForm: React.FC<Props> = ({ schedule, weekStart, onDone }) => {
  const { data: employees = [] } = useEmployeeDirectory();
  const { data: clients = [] } = useClients();
  const { logoUrl } = useCompanyLogo();
  const { settings } = useCompanySettings();
  const { create, update } = useWeeklySchedules(weekStart);

  const [assigneeUserId, setAssigneeUserId] = useState<string>(
    schedule?.assignee_user_id ?? ''
  );
  const [isTeam, setIsTeam] = useState<boolean>(
    !!schedule && !schedule.assignee_user_id
  );
  const [teamName, setTeamName] = useState<string>(
    schedule && !schedule.assignee_user_id ? schedule.assignee_name : ''
  );
  const [entries, setEntries] = useState<WeeklyScheduleEntry[]>(
    buildWeekEntries(schedule?.week_start ?? weekStart, schedule?.entries ?? [])
  );
  const [notes, setNotes] = useState(schedule?.notes ?? '');
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null);
  const [generating, setGenerating] = useState(false);

  const clientsByName = useMemo(() => {
    const map = new Map<string, (typeof clients)[number]>();
    (clients ?? []).forEach(c => map.set((c.client_name ?? '').trim().toLowerCase(), c));
    return map;
  }, [clients]);

  const assigneeName = useMemo(() => {
    if (isTeam) return teamName.trim();
    const emp = (employees as any[]).find(e => e.user_id === assigneeUserId);
    return emp ? `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim() : '';
  }, [isTeam, teamName, employees, assigneeUserId]);

  const patchEntry = (date: string, patch: Partial<WeeklyScheduleEntry>) =>
    setEntries(prev => prev.map(e => (e.date === date ? { ...e, ...patch } : e)));

  /**
   * Typing a client name that matches the client list links the row and, when the
   * address is still blank, fills it from the client record.
   */
  const handleClientChange = (entry: WeeklyScheduleEntry, value: string) => {
    const match = clientsByName.get(value.trim().toLowerCase());
    patchEntry(entry.date, {
      client_name: value,
      client_id: match?.id ?? null,
      address:
        match?.client_address && !entry.address.trim() ? match.client_address : entry.address,
    });
  };

  const copyFromRowAbove = (index: number) => {
    if (index === 0) return;
    const above = entries[index - 1];
    patchEntry(entries[index].date, {
      client_name: above.client_name,
      client_id: above.client_id,
      start_time: above.start_time,
      address: above.address,
      service: above.service,
    });
  };

  const validate = (): string | null => {
    if (!assigneeName) return 'Choose an employee or type a team name first.';
    if (!entries.some(entryIsFilled)) return 'Add at least one day to the schedule.';
    return null;
  };

  const handleSave = async (status: 'draft' | 'published') => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(status);
    try {
      const input = {
        week_start: schedule?.week_start ?? weekStart,
        assignee_user_id: isTeam ? null : assigneeUserId || null,
        assignee_name: assigneeName,
        entries,
        notes,
        status,
      };

      if (schedule) {
        await update.mutateAsync({ id: schedule.id, input });
      } else {
        await create.mutateAsync(input);
      }

      toast.success(
        status === 'published'
          ? `Schedule published — ${assigneeName} can see it in the app`
          : 'Schedule saved as draft'
      );
      onDone();
    } catch {
      // the mutation already surfaced the error toast
    } finally {
      setSaving(null);
    }
  };

  const handleDownload = async () => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    setGenerating(true);
    try {
      await generateWeeklySchedulePDF(
        [
          {
            assigneeName,
            weekStart: schedule?.week_start ?? weekStart,
            entries,
            notes,
          },
        ],
        {
          companyName: settings?.company_name ?? '7 Star Family',
          logoUrl,
          phone: settings?.company_phone ?? null,
          email: settings?.company_email ?? null,
        }
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const activeWeek = schedule?.week_start ?? weekStart;
  const busy = saving !== null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="icon" onClick={onDone} aria-label="Back to schedules">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {schedule ? 'Edit weekly schedule' : 'New weekly schedule'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Week of {formatWeekRange(activeWeek)}
              {schedule?.status === 'published' && ' · published'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={generating || busy}>
            {generating ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-4 w-4" />
            )}
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={busy}>
            {saving === 'draft' ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save draft
          </Button>
          <Button onClick={() => handleSave('published')} disabled={busy}>
            {saving === 'published' ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            Publish
          </Button>
        </div>
      </div>

      {/* Assignee */}
      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Employee or team</Label>
            <Select
              value={isTeam ? TEAM_OPTION : assigneeUserId}
              onValueChange={value => {
                if (value === TEAM_OPTION) {
                  setIsTeam(true);
                  setAssigneeUserId('');
                } else {
                  setIsTeam(false);
                  setAssigneeUserId(value);
                }
              }}
              disabled={!!schedule}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select who this week is for" />
              </SelectTrigger>
              <SelectContent>
                {(employees as any[]).map(e => (
                  <SelectItem key={e.user_id} value={e.user_id}>
                    {`${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || e.email}
                  </SelectItem>
                ))}
                <SelectItem value={TEAM_OPTION}>Team / other name…</SelectItem>
              </SelectContent>
            </Select>
            {!!schedule && (
              <p className="text-xs text-muted-foreground">
                Delete and recreate the schedule to move it to someone else.
              </p>
            )}
          </div>

          {isTeam ? (
            <div className="space-y-1.5">
              <Label htmlFor="team-name">Team name</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="e.g. Team Luan"
              />
              <p className="text-xs text-muted-foreground">
                A team sheet prints and saves normally, but nobody sees it in the employee app.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Visible to</Label>
              <div className="flex h-10 items-center text-sm text-muted-foreground">
                {assigneeName
                  ? `${assigneeName} sees this week once published`
                  : 'Pick an employee to publish it to their app'}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Day rows — desktop */}
      <Card className="hidden overflow-hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-amber-100/70">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold w-[150px]">Date</th>
              <th className="px-3 py-2 font-semibold w-[180px]">Client / Job site</th>
              <th className="px-3 py-2 font-semibold w-[130px]">Start time</th>
              <th className="px-3 py-2 font-semibold">Address</th>
              <th className="px-3 py-2 font-semibold w-[150px]">Service</th>
              <th className="px-3 py-2 font-semibold w-[160px]">Notes</th>
              <th className="px-2 py-2 w-[40px]" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={entry.date} className="border-t align-top">
                <td className="bg-emerald-50/80 px-3 py-2 font-medium">
                  {formatDayLabel(entry.date)}
                </td>
                <td className="px-3 py-2">
                  <Input
                    list="weekly-schedule-clients"
                    value={entry.client_name}
                    onChange={e => handleClientChange(entry, e.target.value)}
                    placeholder="Client or job site"
                    className="h-9"
                  />
                </td>
                <td className="px-3 py-2">
                  {entry.start_time === TBC ? (
                    <Badge
                      variant="secondary"
                      className="h-9 w-full cursor-pointer justify-center gap-1 font-normal"
                      onClick={() => patchEntry(entry.date, { start_time: '' })}
                    >
                      To be confirmed <X className="h-3 w-3" />
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Input
                        type="time"
                        value={entry.start_time}
                        onChange={e => patchEntry(entry.date, { start_time: e.target.value })}
                        className="h-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 px-1.5 text-[11px] text-muted-foreground"
                        onClick={() => patchEntry(entry.date, { start_time: TBC })}
                        title="Mark start time as to be confirmed"
                      >
                        TBC
                      </Button>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={entry.address}
                    onChange={e => patchEntry(entry.date, { address: e.target.value })}
                    placeholder="Street, city"
                    className="h-9"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    list="weekly-schedule-services"
                    value={entry.service}
                    onChange={e => patchEntry(entry.date, { service: e.target.value })}
                    placeholder="Insurance"
                    className="h-9"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={entry.notes}
                    onChange={e => patchEntry(entry.date, { notes: e.target.value })}
                    placeholder="Lockbox, keys…"
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-2">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground"
                      onClick={() => copyFromRowAbove(index)}
                      title="Copy the day above"
                    >
                      <ArrowUpToLine className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Day rows — mobile */}
      <div className="space-y-3 md:hidden">
        {entries.map((entry, index) => (
          <Card key={entry.date} className="space-y-3 p-3">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-sm font-semibold">
                {formatDayLabel(entry.date)}
              </span>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => copyFromRowAbove(index)}
                >
                  <ArrowUpToLine className="mr-1 h-3.5 w-3.5" /> Copy above
                </Button>
              )}
            </div>

            <Input
              list="weekly-schedule-clients"
              value={entry.client_name}
              onChange={e => handleClientChange(entry, e.target.value)}
              placeholder="Client or job site"
            />

            <div className="grid grid-cols-2 gap-2">
              {entry.start_time === TBC ? (
                <Badge
                  variant="secondary"
                  className="h-10 cursor-pointer justify-center gap-1 font-normal"
                  onClick={() => patchEntry(entry.date, { start_time: '' })}
                >
                  TBC <X className="h-3 w-3" />
                </Badge>
              ) : (
                <div className="flex items-center gap-1">
                  <Input
                    type="time"
                    value={entry.start_time}
                    onChange={e => patchEntry(entry.date, { start_time: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-1.5 text-[11px] text-muted-foreground"
                    onClick={() => patchEntry(entry.date, { start_time: TBC })}
                  >
                    TBC
                  </Button>
                </div>
              )}
              <Input
                list="weekly-schedule-services"
                value={entry.service}
                onChange={e => patchEntry(entry.date, { service: e.target.value })}
                placeholder="Service"
              />
            </div>

            <Input
              value={entry.address}
              onChange={e => patchEntry(entry.date, { address: e.target.value })}
              placeholder="Address"
            />
            <Input
              value={entry.notes}
              onChange={e => patchEntry(entry.date, { notes: e.target.value })}
              placeholder="Notes (lockbox, keys…)"
            />
          </Card>
        ))}
      </div>

      {/* Shared suggestion lists */}
      <datalist id="weekly-schedule-clients">
        {(clients ?? []).map(c => (
          <option key={c.id} value={c.client_name} />
        ))}
      </datalist>
      <datalist id="weekly-schedule-services">
        {SERVICE_SUGGESTIONS.map(s => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {/* Week notes */}
      <Card className="space-y-1.5 p-4">
        <Label htmlFor="week-notes">Week notes</Label>
        <Textarea
          id="week-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything the crew should know about this week"
        />
      </Card>
    </div>
  );
};

export default WeeklyScheduleForm;

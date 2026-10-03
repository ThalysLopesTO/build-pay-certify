import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Clock, Download, Loader2, MapPin, Pencil, Save, Send, Users } from 'lucide-react';
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
import { formatDayLabel, formatScheduleTime, formatWeekRange } from '@/utils/weeklyScheduleWeek';
import { generateWeeklySchedulePDF } from '@/utils/weeklySchedulePDF';
import {
  SERVICE_SUGGESTIONS,
  WeeklyScheduleDayDialog,
} from './WeeklyScheduleDayDialog';

const DEFAULT_TITLE = 'Weekly schedule';

interface Props {
  /** Existing sheet to edit, or null for a new one. */
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

  const activeWeek = schedule?.week_start ?? weekStart;

  const [title, setTitle] = useState(schedule?.assignee_name ?? '');
  const [entries, setEntries] = useState<WeeklyScheduleEntry[]>(
    buildWeekEntries(activeWeek, schedule?.entries ?? [])
  );
  const [notes, setNotes] = useState(schedule?.notes ?? '');
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null);
  const [generating, setGenerating] = useState(false);

  const editingIndex = entries.findIndex(e => e.date === editingDate);

  const saveDay = (updated: WeeklyScheduleEntry) =>
    setEntries(prev => prev.map(e => (e.date === updated.date ? updated : e)));

  const validate = (): string | null => {
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
        week_start: activeWeek,
        title: title.trim() || DEFAULT_TITLE,
        entries,
        notes,
        status,
      };

      if (schedule) {
        await update.mutateAsync({ id: schedule.id, input });
      } else {
        await create.mutateAsync(input);
      }

      const crewCount = new Set(entries.flatMap(e => e.employee_ids)).size;
      toast.success(
        status === 'published'
          ? crewCount > 0
            ? `Published — ${crewCount} employee${crewCount === 1 ? '' : 's'} can see their days`
            : 'Published, but no employee is on any day yet'
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
        [{ assigneeName: title.trim() || DEFAULT_TITLE, weekStart: activeWeek, entries, notes }],
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

      {/* Sheet name */}
      <Card className="space-y-1.5 p-4">
        <Label htmlFor="sheet-title">Schedule name (optional)</Label>
        <Input
          id="sheet-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={DEFAULT_TITLE}
          className="max-w-sm"
        />
        <p className="text-xs text-muted-foreground">
          Only needed when a week has more than one schedule — "Edmonton crew", for example.
        </p>
      </Card>

      {/* The week — one row per day, same on every device */}
      <Card className="divide-y overflow-hidden">
        {entries.map(entry => {
          const filled = entryIsFilled(entry);
          return (
            <button
              key={entry.date}
              type="button"
              onClick={() => setEditingDate(entry.date)}
              className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/40 sm:px-4"
            >
              <span className="w-[108px] shrink-0 text-sm font-semibold sm:w-[150px]">
                {formatDayLabel(entry.date)}
              </span>

              <span className="min-w-0 flex-1 space-y-1">
                {filled ? (
                  <>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium">{entry.client_name || '—'}</span>
                      {entry.start_time && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {formatScheduleTime(entry.start_time)}
                        </span>
                      )}
                      {entry.service && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {entry.service}
                        </span>
                      )}
                    </span>

                    {entry.address && (
                      <span className="flex items-start gap-1 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">{entry.address}</span>
                      </span>
                    )}

                    <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {entry.employee_names.length > 0 ? (
                        entry.employee_names.map(name => (
                          <span
                            key={name}
                            className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <Users className="h-3.5 w-3.5" /> nobody assigned yet
                        </span>
                      )}
                    </span>

                    {entry.notes && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {entry.notes}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Nothing scheduled — tap to add</span>
                )}
              </span>

              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border text-muted-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </Card>

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

      {/* Suggestion lists shared by the dialog */}
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

      <WeeklyScheduleDayDialog
        open={editingIndex >= 0}
        entry={editingIndex >= 0 ? entries[editingIndex] : null}
        previous={editingIndex > 0 ? entries[editingIndex - 1] : null}
        employees={employees as any[]}
        clients={(clients ?? []) as any[]}
        onSave={saveDay}
        onClose={() => setEditingDate(null)}
      />
    </div>
  );
};

export default WeeklyScheduleForm;

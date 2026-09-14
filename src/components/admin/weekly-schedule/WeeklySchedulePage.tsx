import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CopyPlus,
  Download,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import {
  buildWeekEntries,
  countScheduledDays,
  entryIsFilled,
  useWeeklySchedules,
  type WeeklySchedule,
} from '@/hooks/useWeeklySchedules';
import {
  addWeeks,
  formatScheduleTime,
  formatWeekRange,
  getWeekStart,
  isCurrentWeek,
} from '@/utils/weeklyScheduleWeek';
import { generateWeeklySchedulePDF } from '@/utils/weeklySchedulePDF';
import { WeeklyScheduleForm } from './WeeklyScheduleForm';

const dayName = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });

export const WeeklySchedulePage: React.FC = () => {
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<WeeklySchedule | null>(null);
  const [toDelete, setToDelete] = useState<WeeklySchedule | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { list, remove, copyWeek } = useWeeklySchedules(weekStart);
  const { logoUrl } = useCompanyLogo();
  const { settings } = useCompanySettings();

  const schedules = list.data ?? [];

  const branding = {
    companyName: settings?.company_name ?? '7 Star Family',
    logoUrl,
    phone: settings?.company_phone ?? null,
    email: settings?.company_email ?? null,
  };

  const download = async (sheets: WeeklySchedule[], key: string) => {
    setDownloadingId(key);
    try {
      await generateWeeklySchedulePDF(
        sheets.map(s => ({
          assigneeName: s.assignee_name,
          weekStart: s.week_start,
          entries: buildWeekEntries(s.week_start, s.entries),
          notes: s.notes,
        })),
        branding
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to generate PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  if (mode === 'form') {
    return (
      <WeeklyScheduleForm
        schedule={editing}
        weekStart={weekStart}
        onDone={() => {
          setEditing(null);
          setMode('list');
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Weekly Schedule</h1>
          <p className="text-sm text-muted-foreground">
            Build each employee's week, publish it to their app and keep the record.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setMode('form');
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> New schedule
        </Button>
      </div>

      {/* Week navigator */}
      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart(w => addWeeks(w, -1))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[190px] text-center">
            <p className="text-sm font-semibold">{formatWeekRange(weekStart)}</p>
            <p className="text-xs text-muted-foreground">
              {isCurrentWeek(weekStart) ? 'This week' : 'Week of ' + weekStart}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart(w => addWeeks(w, 1))}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isCurrentWeek(weekStart) && (
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(getWeekStart())}>
              Today
            </Button>
          )}
        </div>

        {schedules.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyWeek.mutate({ from: schedules, to: addWeeks(weekStart, 1) })}
              disabled={copyWeek.isPending}
            >
              {copyWeek.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CopyPlus className="mr-1.5 h-3.5 w-3.5" />
              )}
              Copy to next week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => download(schedules, 'all')}
              disabled={downloadingId === 'all'}
            >
              {downloadingId === 'all' ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-3.5 w-3.5" />
              )}
              PDF — whole week
            </Button>
          </div>
        )}
      </Card>

      {/* Schedules */}
      {list.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading schedules…
        </div>
      ) : schedules.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No schedules for this week yet</p>
            <p className="text-sm text-muted-foreground">
              Create one per employee or team, then publish it.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {schedules.map(schedule => {
            const entries = buildWeekEntries(schedule.week_start, schedule.entries);
            const filled = entries.filter(entryIsFilled);
            return (
              <Card key={schedule.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{schedule.assignee_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {countScheduledDays(schedule.entries)} day
                      {countScheduledDays(schedule.entries) === 1 ? '' : 's'} scheduled
                      {!schedule.assignee_user_id && ' · team sheet'}
                    </p>
                  </div>
                  <Badge variant={schedule.status === 'published' ? 'default' : 'secondary'}>
                    {schedule.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                </div>

                <ul className="space-y-1 text-sm">
                  {filled.slice(0, 4).map(entry => (
                    <li key={entry.date} className="flex gap-2">
                      <span className="w-10 shrink-0 font-medium text-muted-foreground">
                        {dayName(entry.date)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {entry.client_name || '—'}
                        {entry.start_time && (
                          <span className="text-muted-foreground">
                            {' · '}
                            {formatScheduleTime(entry.start_time)}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                  {filled.length > 4 && (
                    <li className="text-xs text-muted-foreground">
                      +{filled.length - 4} more day{filled.length - 4 === 1 ? '' : 's'}
                    </li>
                  )}
                </ul>

                <div className="mt-auto flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditing(schedule);
                      setMode('form');
                    }}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => download([schedule], schedule.id)}
                    disabled={downloadingId === schedule.id}
                  >
                    {downloadingId === schedule.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setToDelete(schedule)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={open => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.assignee_name}'s week of {toDelete && formatWeekRange(toDelete.week_start)}{' '}
              will be permanently removed from the history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (toDelete) await remove.mutateAsync(toDelete.id);
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WeeklySchedulePage;

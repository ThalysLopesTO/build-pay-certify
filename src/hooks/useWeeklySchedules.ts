/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { getWeekStart, weekDates } from '@/utils/weeklyScheduleWeek';

/** One day of the week on a schedule sheet. */
export interface WeeklyScheduleEntry {
  date: string; // yyyy-MM-dd
  client_name: string;
  /** Set when the typed client matched a row in `clients` — keeps the history linkable. */
  client_id: string | null;
  start_time: string; // 'HH:mm', or free text like 'To be confirmed'
  address: string;
  service: string;
  notes: string;
}

export interface WeeklySchedule {
  id: string;
  company_id: string;
  week_start: string;
  assignee_user_id: string | null;
  assignee_name: string;
  entries: WeeklyScheduleEntry[];
  notes: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyScheduleInput {
  week_start: string;
  assignee_user_id: string | null;
  assignee_name: string;
  entries: WeeklyScheduleEntry[];
  notes?: string | null;
  status: 'draft' | 'published';
}

export const emptyEntry = (date: string): WeeklyScheduleEntry => ({
  date,
  client_name: '',
  client_id: null,
  start_time: '',
  address: '',
  service: '',
  notes: '',
});

/** Always hand the form 7 rows (Mon→Sun), filling gaps in whatever was saved. */
export const buildWeekEntries = (
  weekStart: string,
  saved: WeeklyScheduleEntry[] = []
): WeeklyScheduleEntry[] => {
  const byDate = new Map(saved.map(e => [e.date, e]));
  return weekDates(weekStart).map(date => ({ ...emptyEntry(date), ...(byDate.get(date) ?? {}), date }));
};

export const entryIsFilled = (e: WeeklyScheduleEntry): boolean =>
  !!(e.client_name.trim() || e.address.trim() || e.start_time.trim() || e.service.trim() || e.notes.trim());

export const countScheduledDays = (entries: WeeklyScheduleEntry[] = []): number =>
  entries.filter(entryIsFilled).length;

const QUERY_KEY = ['weekly-schedules'] as const;

/** Every schedule for one week — admins, management and foremen. */
export const useWeeklySchedules = (weekStart: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: [...QUERY_KEY, user?.companyId, weekStart],
    queryFn: async (): Promise<WeeklySchedule[]> => {
      if (!user?.companyId) return [];
      const { data, error } = await supabase
        .from('weekly_schedules' as any)
        .select('*')
        .eq('company_id', user.companyId)
        .eq('week_start', weekStart)
        .order('assignee_name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as WeeklySchedule[];
    },
    enabled: !!user?.companyId && !!weekStart,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  /**
   * Same week handed to several employees at once — each one gets their own
   * sheet, so the office can tweak a person's days later without touching the
   * others. Inserted in one statement: if anybody in the batch already has a
   * sheet that week, nothing is written (the picker greys those people out).
   */
  const createMany = useMutation({
    mutationFn: async ({
      assignees,
      ...input
    }: Omit<WeeklyScheduleInput, 'assignee_user_id' | 'assignee_name'> & {
      assignees: { user_id: string | null; name: string }[];
    }): Promise<number> => {
      if (!user?.companyId || !user?.id) throw new Error('Not authenticated');
      if (assignees.length === 0) throw new Error('Select at least one employee');
      const createdByName =
        [(user as any)?.firstName, (user as any)?.lastName].filter(Boolean).join(' ').trim() || null;

      const rows = assignees.map(a => ({
        ...input,
        notes: input.notes?.trim() ? input.notes : null,
        published_at: input.status === 'published' ? new Date().toISOString() : null,
        assignee_user_id: a.user_id,
        assignee_name: a.name,
        company_id: user.companyId,
        created_by: user.id,
        created_by_name: createdByName,
      }));

      const { error } = await supabase.from('weekly_schedules' as any).insert(rows as any);
      if (error) {
        if (error.code === '23505') {
          throw new Error('One of those employees already has a schedule for this week.');
        }
        throw error;
      }
      return rows.length;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Failed to save schedules'),
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<WeeklyScheduleInput> }) => {
      const patch: Record<string, unknown> = { ...input };
      if (input.notes !== undefined) patch.notes = input.notes?.trim() ? input.notes : null;
      if (input.status === 'published') patch.published_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('weekly_schedules' as any)
        .update(patch as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as WeeklySchedule;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Failed to update schedule'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('weekly_schedules' as any)
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('You do not have permission to delete this schedule');
      }
      return id;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Schedule deleted');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to delete schedule'),
  });

  /** Copy a whole week forward — the fastest way to build next week. */
  const copyWeek = useMutation({
    mutationFn: async ({ from, to }: { from: WeeklySchedule[]; to: string }) => {
      if (!user?.companyId || !user?.id) throw new Error('Not authenticated');
      const createdByName =
        [(user as any)?.firstName, (user as any)?.lastName].filter(Boolean).join(' ').trim() || null;

      const targetDates = weekDates(to);
      const rows = from.map(sheet => ({
        company_id: user.companyId,
        week_start: to,
        assignee_user_id: sheet.assignee_user_id,
        assignee_name: sheet.assignee_name,
        entries: buildWeekEntries(sheet.week_start, sheet.entries).map((e, i) => ({
          ...e,
          date: targetDates[i],
        })),
        notes: sheet.notes,
        status: 'draft',
        created_by: user.id,
        created_by_name: createdByName,
      }));

      const { error } = await supabase.from('weekly_schedules' as any).insert(rows as any);
      if (error) {
        if (error.code === '23505') {
          throw new Error('Some of those employees already have a schedule in the target week.');
        }
        throw error;
      }
      return rows.length;
    },
    onSuccess: count => {
      invalidate();
      toast.success(`${count} schedule${count === 1 ? '' : 's'} copied`);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to copy week'),
  });

  return { list, createMany, update, remove, copyWeek };
};

/**
 * The signed-in employee's own published schedule for a week.
 * RLS already hides drafts and other people's rows; the filters keep it cheap.
 */
export const useMyWeeklySchedule = (weekStart: string = getWeekStart()) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-weekly-schedule', user?.id, user?.companyId, weekStart],
    queryFn: async (): Promise<WeeklySchedule | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('weekly_schedules' as any)
        .select('*')
        .eq('assignee_user_id', user.id)
        .eq('week_start', weekStart)
        .eq('status', 'published')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as WeeklySchedule | null;
    },
    enabled: !!user?.id && !!weekStart,
  });
};

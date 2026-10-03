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
  /** Who works this day. Decides which employees see it in their app. */
  employee_ids: string[];
  /** Denormalised for the PDF and the saved history, where ids mean nothing. */
  employee_names: string[];
}

export interface WeeklySchedule {
  id: string;
  company_id: string;
  week_start: string;
  /** Legacy: sheets written before the crew moved onto the day belonged to one person. */
  assignee_user_id: string | null;
  /** The sheet's title. Older rows carry the employee's name here. */
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
  /** Stored in assignee_name — a sheet is the company's week now, not a person's. */
  title: string;
  entries: WeeklyScheduleEntry[];
  notes?: string | null;
  status: 'draft' | 'published';
}

/** The slice of a week an employee is allowed to see. */
export interface MyWeeklySchedule {
  id: string;
  week_start: string;
  title: string | null;
  notes: string | null;
  entries: WeeklyScheduleEntry[];
}

export const emptyEntry = (date: string): WeeklyScheduleEntry => ({
  date,
  client_name: '',
  client_id: null,
  start_time: '',
  address: '',
  service: '',
  notes: '',
  employee_ids: [],
  employee_names: [],
});

/** Always hand the form 7 rows (Mon→Sun), filling gaps in whatever was saved. */
export const buildWeekEntries = (
  weekStart: string,
  saved: WeeklyScheduleEntry[] = []
): WeeklyScheduleEntry[] => {
  const byDate = new Map((saved ?? []).map(e => [e.date, e]));
  return weekDates(weekStart).map(date => {
    const saved = byDate.get(date);
    return {
      ...emptyEntry(date),
      ...(saved ?? {}),
      date,
      // Rows saved before the crew existed come back without these
      employee_ids: saved?.employee_ids ?? [],
      employee_names: saved?.employee_names ?? [],
    };
  });
};

export const entryIsFilled = (e: WeeklyScheduleEntry): boolean =>
  !!(
    e.client_name.trim() ||
    e.address.trim() ||
    e.start_time.trim() ||
    e.service.trim() ||
    e.notes.trim() ||
    (e.employee_ids ?? []).length
  );

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

  /** One sheet for the company's week — the crew lives on each day. */
  const create = useMutation({
    mutationFn: async (input: WeeklyScheduleInput): Promise<WeeklySchedule> => {
      if (!user?.companyId || !user?.id) throw new Error('Not authenticated');
      const createdByName =
        [(user as any)?.firstName, (user as any)?.lastName].filter(Boolean).join(' ').trim() || null;

      const { title, ...rest } = input;
      const { data, error } = await supabase
        .from('weekly_schedules' as any)
        .insert({
          ...rest,
          notes: rest.notes?.trim() ? rest.notes : null,
          published_at: rest.status === 'published' ? new Date().toISOString() : null,
          assignee_user_id: null,
          assignee_name: title,
          company_id: user.companyId,
          created_by: user.id,
          created_by_name: createdByName,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as WeeklySchedule;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Failed to save schedule'),
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<WeeklyScheduleInput> }) => {
      const { title, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest };
      if (title !== undefined) patch.assignee_name = title;
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
      if (error) throw error;
      return rows.length;
    },
    onSuccess: count => {
      invalidate();
      toast.success(`${count} schedule${count === 1 ? '' : 's'} copied`);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to copy week'),
  });

  return { list, create, update, remove, copyWeek };
};

/**
 * The days of a published week the signed-in employee is crewed on.
 * Read through a SECURITY DEFINER RPC: the sheet holds everybody's jobs, and
 * an employee has no business seeing the rest of it.
 */
export const useMyWeeklySchedule = (weekStart: string = getWeekStart()) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-weekly-schedule', user?.id, user?.companyId, weekStart],
    queryFn: async (): Promise<MyWeeklySchedule | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase.rpc('get_my_weekly_schedule' as any, {
        p_week_start: weekStart,
      });
      if (error) throw error;
      const row = (data as any[])?.[0];
      if (!row) return null;
      return {
        id: row.id,
        week_start: row.week_start,
        title: row.title ?? null,
        notes: row.notes ?? null,
        entries: (row.entries ?? []) as WeeklyScheduleEntry[],
      };
    },
    enabled: !!user?.id && !!weekStart,
  });
};

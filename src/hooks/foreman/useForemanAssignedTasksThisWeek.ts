import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export type ForemanAssignedTaskItem = {
  jobsiteId: string;
  jobsiteName: string;
  jobsiteAddress?: string | null;
  taskId: string;
  taskTitle: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
};

interface UseForemanAssignedTasksThisWeekResult {
  loading: boolean;
  error: Error | null;
  items: ForemanAssignedTaskItem[];
  refetch: () => void;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getWeekBoundsInTZ(timezone: string): { startOfWeek: string; endOfWeek: string } {
  // Get today's date in the target timezone (as calendar date)
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.format(new Date()); // YYYY-MM-DD for en-CA
  // parts may be in format YYYY-MM-DD
  const [y, m, d] = parts.split("-").map((s) => parseInt(s, 10));
  const today = new Date(y, (m || 1) - 1, d || 1);
  const dayIdx = today.getDay(); // 0 = Sun ... 6 = Sat
  const start = new Date(today);
  start.setDate(today.getDate() - dayIdx);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startOfWeek: toYMD(start), endOfWeek: toYMD(end) };
}

function computeDurationDays(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  const diff = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1; // inclusive
  return diff > 0 ? diff : 1;
}

export function useForemanAssignedTasksThisWeek(): UseForemanAssignedTasksThisWeekResult {
  const { user } = useAuth();
  const uid = user?.id || null;
  const companyId = (user as any)?.companyId || null;

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["foreman-assigned-tasks-this-week", uid, companyId],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [] as ForemanAssignedTaskItem[];

      // Fetch company timezone (fallback to America/Toronto)
      let timezone = "America/Toronto";
      if (companyId) {
        const { data: settings } = await supabase
          .from("company_settings")
          .select("timezone")
          .eq("company_id", companyId)
          .maybeSingle();
        if (settings?.timezone) timezone = settings.timezone;
      }

      const { startOfWeek, endOfWeek } = getWeekBoundsInTZ(timezone);

      // Single query to fetch active jobsites assigned to the foreman with their tasks
      const { data: rows, error } = await supabase
        .from("jobsites")
        .select(`
          id,
          name,
          address,
          status,
          jobsite_foremen!inner(foreman_id),
          jobsite_tasks (
            id,
            task_name,
            status,
            start_date,
            end_date
          )
        `)
        .eq("jobsite_foremen.foreman_id", uid)
        .eq("status", "active");

      if (error) throw error;

      const items: ForemanAssignedTaskItem[] = [];

      (rows || []).forEach((row: any) => {
        const tasks = (row.jobsite_tasks || []) as Array<{
          id: string;
          task_name: string;
          status: string;
          start_date?: string | null;
          end_date?: string | null;
        }>;

        tasks.forEach((t) => {
          const status = (t.status || "").toLowerCase();
          const isIncludedStatus = status === "pending" || status === "in_progress";
          if (!isIncludedStatus) return;

          const hasStart = !!t.start_date;
          const hasEnd = !!t.end_date;
          const overlapsWeek =
            (hasStart && hasEnd && t.start_date! <= endOfWeek && t.end_date! >= startOfWeek) ||
            (!hasStart || !hasEnd); // include tasks with missing dates

          if (!overlapsWeek) return;

          items.push({
            jobsiteId: row.id,
            jobsiteName: row.name,
            jobsiteAddress: row.address ?? null,
            taskId: t.id,
            taskTitle: t.task_name || "Task",
            status: t.status,
            startDate: t.start_date ?? null,
            endDate: t.end_date ?? null,
            durationDays: computeDurationDays(t.start_date ?? null, t.end_date ?? null),
          });
        });
      });

      items.sort((a, b) => {
        const aTime = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });

      return items.slice(0, 5);
    },
  });

  return {
    loading: isLoading,
    error: error as Error | null,
    items: (data as ForemanAssignedTaskItem[]) || [],
    refetch,
  };
}

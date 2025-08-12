import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export type ForemanAssignedProject = {
  id: string;
  name: string;
  address?: string | null;
  progressPct: number;
  nextTask?: {
    id: string;
    title: string;
    start_date?: string | null;
    end_date?: string | null;
    durationDays?: number | null;
    status: string;
  } | null;
};

interface UseForemanAssignedProjectsResult {
  loading: boolean;
  error: Error | null;
  jobsites: ForemanAssignedProject[];
  refetch: () => void;
}

function computeDurationDays(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  const diff = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1; // inclusive
  return diff > 0 ? diff : 1;
}

export function useForemanAssignedProjects(foremanId?: string): UseForemanAssignedProjectsResult {
  const { user } = useAuth();
  const uid = foremanId || user?.id || null;

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["foreman-assigned-projects", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [] as any[];

      // Single query: jobsites with nested tasks filtered client-side for simplicity and reliability
      const { data, error } = await supabase
        .from("jobsites")
        .select(`
          id,
          name,
          address,
          status,
          starting_date,
          due_date,
          jobsite_tasks (
            id,
            task_name,
            status,
            start_date,
            end_date
          )
        `)
        .eq("assigned_foreman_id", uid)
        .eq("status", "active");

      if (error) throw error;
      const rows = (data || []) as Array<any>;

      const projects: ForemanAssignedProject[] = rows.map((row) => {
        const tasks = (row.jobsite_tasks || []) as Array<{
          id: string;
          task_name: string;
          status: string;
          start_date?: string | null;
          end_date?: string | null;
        }>;

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "completed").length;
        const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const upcoming = tasks
          .filter((t) => t.status === "pending" || t.status === "in_progress")
          .sort((a, b) => {
            const aTime = a.start_date ? new Date(a.start_date).getTime() : Number.MAX_SAFE_INTEGER;
            const bTime = b.start_date ? new Date(b.start_date).getTime() : Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
          });

        const next = upcoming[0];

        return {
          id: row.id,
          name: row.name,
          address: row.address ?? null,
          progressPct,
          nextTask: next
            ? {
                id: next.id,
                title: next.task_name || "Task",
                start_date: next.start_date ?? null,
                end_date: next.end_date ?? null,
                durationDays: computeDurationDays(next.start_date ?? null, next.end_date ?? null),
                status: next.status,
              }
            : null,
        } as ForemanAssignedProject;
      });

      // Sort: nearest nextTask start_date first, then least progress
      projects.sort((a, b) => {
        const aTime = a.nextTask?.start_date ? new Date(a.nextTask.start_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.nextTask?.start_date ? new Date(b.nextTask.start_date).getTime() : Number.MAX_SAFE_INTEGER;
        if (aTime !== bTime) return aTime - bTime;
        return a.progressPct - b.progressPct;
      });

      return projects;
    },
  });

  return {
    loading: isLoading,
    error: error as Error | null,
    jobsites: (data as ForemanAssignedProject[]) || [],
    refetch,
  };
}

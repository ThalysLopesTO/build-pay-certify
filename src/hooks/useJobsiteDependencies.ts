import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface JobsiteDependencies {
  materialRequests: number;
  timesheets: number;
  weeklyTimesheets: number;
  inventory: number;
  attentionReports: number;
  dailyReports: number;
  missedPunchRequests: number;
  materialTakeoffNotes: number;
  jobsiteForemen: number;
  jobsiteTasks: number;
  invoices: number;
  auditLogs: number;
}

export const useJobsiteDependencies = (jobsiteId: string) => {
  return useQuery({
    queryKey: ['jobsite-dependencies', jobsiteId],
    queryFn: async (): Promise<JobsiteDependencies> => {
      if (!jobsiteId) throw new Error('Jobsite ID is required');

      const [
        materialRequests,
        timesheets,
        weeklyTimesheets,
        inventory,
        attentionReports,
        dailyReports,
        missedPunchRequests,
        materialTakeoffNotes,
        jobsiteForemen,
        jobsiteTasks,
        invoices,
        auditLogs,
      ] = await Promise.all([
        supabase.from('material_requests').select('id', { count: 'exact' }).eq('jobsite_id', jobsiteId),
        supabase.from('timesheets').select('id', { count: 'exact' }).eq('jobsite_id', jobsiteId),
        supabase.from('weekly_timesheets').select('id', { count: 'exact' }).eq('jobsite_id', jobsiteId),
        supabase.from('inventory').select('id', { count: 'exact' }).eq('jobsite_id', jobsiteId),
        supabase.from('attention_reports').select('id', { count: 'exact' }).eq('jobsite_id', jobsiteId),
        supabase.from('daily_reports').select('id', { count: 'exact' }).eq('jobsite_id', jobsiteId),
        supabase.from('missed_punch_requests').select('id', { count: 'exact' }).eq('jobsite_id', jobsiteId),
        supabase.from('material_takeoff_notes').select('id', { count: 'exact' }).eq('jobsite_id', jobsiteId),
        supabase.from('jobsite_foremen').select('id', { count: 'exact' }).eq('jobsite_id', jobsiteId),
        supabase.from('jobsite_tasks').select('id', { count: 'exact' }).eq('jobsite_id', jobsiteId),
        supabase.from('invoices').select('id', { count: 'exact' }).eq('jobsite_id', jobsiteId),
        supabase.from('audit_logs').select('id', { count: 'exact' }).or(`original_jobsite_id.eq.${jobsiteId},new_jobsite_id.eq.${jobsiteId}`),
      ]);

      return {
        materialRequests: materialRequests.count || 0,
        timesheets: timesheets.count || 0,
        weeklyTimesheets: weeklyTimesheets.count || 0,
        inventory: inventory.count || 0,
        attentionReports: attentionReports.count || 0,
        dailyReports: dailyReports.count || 0,
        missedPunchRequests: missedPunchRequests.count || 0,
        materialTakeoffNotes: materialTakeoffNotes.count || 0,
        jobsiteForemen: jobsiteForemen.count || 0,
        jobsiteTasks: jobsiteTasks.count || 0,
        invoices: invoices.count || 0,
        auditLogs: auditLogs.count || 0,
      };
    },
    enabled: !!jobsiteId,
  });
};
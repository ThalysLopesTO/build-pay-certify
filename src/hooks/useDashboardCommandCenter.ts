import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface CommandCenterData {
  // "Needs Action" panel — things requiring a decision today
  pendingTimesheets: number;
  pendingMaterialRequests: number;
  overdueInvoices: number;
  overdueInvoicesAmount: number;
  pendingAttentionReports: number;
  pendingTimeRequests: number;

  // "Site Status" strip — live operational view
  workersOnClockNow: number;
  activeSiteCount: number;
  totalHoursToday: number;

  // "Alerts" panel — things expiring or anomalous
  certsExpiringIn30Days: number;
  certsExpiringIn7Days: number;
}

export const useDashboardCommandCenter = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-command-center', user?.companyId],
    queryFn: async (): Promise<CommandCenterData> => {
      if (!user?.companyId) throw new Error('No company ID');

      const companyId = user.companyId;
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [
        timesheetsRes,
        materialRes,
        overdueInvoicesRes,
        attentionRes,
        timeRequestsRes,
        activeClockRes,
        activeSitesRes,
        certsRes,
      ] = await Promise.all([
        // Timesheets submitted / awaiting approval
        supabase
          .from('timesheets')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .in('status', ['submitted', 'pending_approval', 'pending']),

        // Material requests pending
        supabase
          .from('material_requests')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'pending'),

        // Overdue invoices with total amount
        supabase
          .from('invoices')
          .select('total_amount')
          .eq('company_id', companyId)
          .eq('status', 'pending')
          .lt('due_date', now.toISOString().split('T')[0]),

        // Attention reports unreviewed
        supabase
          .from('attention_reports')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .in('status', ['pending', 'open', 'submitted']),

        // Missed-punch / time requests pending (weekly_timesheets with approval_status)
        supabase
          .from('timesheets')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'missed_punch_pending'),

        // Workers clocked in RIGHT NOW (check_in today, no check_out)
        supabase
          .from('timesheets')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('check_in_time', todayStart.toISOString())
          .is('check_out_time', null),

        // Active jobsite count
        supabase
          .from('jobsites')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'active'),

        // Certificates expiring in 30 days (active certs only)
        supabase
          .from('employee_certificates')
          .select('expiry_date')
          .eq('company_id', companyId)
          .neq('status', 'archived')
          .not('expiry_date', 'is', null)
          .lte('expiry_date', in30Days.toISOString().split('T')[0])
          .gte('expiry_date', now.toISOString().split('T')[0]),
      ]);

      // Calculate total hours clocked in today (completed shifts only)
      const { data: todayShifts } = await supabase
        .from('timesheets')
        .select('check_in_time, check_out_time')
        .eq('company_id', companyId)
        .gte('check_in_time', todayStart.toISOString())
        .not('check_out_time', 'is', null);

      const totalHoursToday = (todayShifts ?? []).reduce((sum, ts) => {
        if (!ts.check_in_time || !ts.check_out_time) return sum;
        return sum + (new Date(ts.check_out_time).getTime() - new Date(ts.check_in_time).getTime()) / 3_600_000;
      }, 0);

      const overdueRows = overdueInvoicesRes.data ?? [];
      const certsExpiring = certsRes.data ?? [];

      return {
        pendingTimesheets: timesheetsRes.count ?? 0,
        pendingMaterialRequests: materialRes.count ?? 0,
        overdueInvoices: overdueRows.length,
        overdueInvoicesAmount: overdueRows.reduce((s, r) => s + (r.total_amount ?? 0), 0),
        pendingAttentionReports: attentionRes.count ?? 0,
        pendingTimeRequests: timeRequestsRes.count ?? 0,
        workersOnClockNow: activeClockRes.count ?? 0,
        activeSiteCount: activeSitesRes.count ?? 0,
        totalHoursToday: Math.round(totalHoursToday * 10) / 10,
        certsExpiringIn30Days: certsExpiring.length,
        certsExpiringIn7Days: certsExpiring.filter(
          (c) => c.expiry_date && new Date(c.expiry_date) <= in7Days
        ).length,
      };
    },
    enabled: !!user?.companyId,
    staleTime: 2 * 60 * 1000,   // 2 min — fresher than the old 5 min
    refetchOnWindowFocus: true,
  });
};

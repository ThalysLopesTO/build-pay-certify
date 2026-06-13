import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface JobsitePnL {
  jobsiteId: string;
  jobsiteName: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;

  invoicedTotal: number;
  paidTotal: number;

  laborCost: number;
  laborHours: number;

  changeOrderTotal: number; // informational — approved COs

  totalCost: number;
  grossProfit: number;
  marginPct: number | null; // null when invoiced = 0
}

export interface JobCostingSummary {
  jobs: JobsitePnL[];
  totalInvoiced: number;
  totalPaid: number;
  totalLaborCost: number;
  totalLaborHours: number;
  totalChangeOrders: number;
  totalGrossProfit: number;
  missingRates: boolean; // true if any timesheet row had no hourly_rate
}

export const useJobCosting = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job-costing', user?.companyId],
    queryFn: async (): Promise<JobCostingSummary> => {
      if (!user?.companyId) throw new Error('No company ID');

      const companyId = user.companyId;

      const [jobsitesRes, timesheetsRes, profilesRes, changeOrdersRes, invoicesRes] =
        await Promise.all([
          supabase
            .from('jobsites')
            .select('id, name, status, starting_date, due_date')
            .eq('company_id', companyId)
            .in('status', ['active', 'completed', 'on_hold']),

          supabase
            .from('timesheets')
            .select('jobsite_id, user_id, hours_worked')
            .eq('company_id', companyId)
            .not('hours_worked', 'is', null)
            .gt('hours_worked', 0),

          supabase
            .from('user_profiles')
            .select('user_id, hourly_rate')
            .eq('company_id', companyId),

          supabase
            .from('change_orders')
            .select('project_id, cost, status')
            .eq('company_id', companyId)
            .not('cost', 'is', null),

          supabase
            .from('invoices')
            .select('jobsite_id, total_amount, status')
            .eq('company_id', companyId)
            .not('jobsite_id', 'is', null),
        ]);

      const jobsites = jobsitesRes.data ?? [];
      const timesheets = timesheetsRes.data ?? [];
      const profiles = profilesRes.data ?? [];
      const changeOrders = changeOrdersRes.data ?? [];
      const invoices = invoicesRes.data ?? [];

      // user_id → hourly_rate
      const rateByUser = new Map<string, number>(
        profiles.map((p) => [p.user_id, p.hourly_rate ?? 0])
      );

      // jobsite_id → timesheet rows
      const tsByJobsite = new Map<string, typeof timesheets>();
      for (const ts of timesheets) {
        if (!ts.jobsite_id) continue;
        const list = tsByJobsite.get(ts.jobsite_id) ?? [];
        list.push(ts);
        tsByJobsite.set(ts.jobsite_id, list);
      }

      // jobsite_id → approved CO total
      const coByJobsite = new Map<string, number>();
      for (const co of changeOrders) {
        if (!co.project_id || !co.cost) continue;
        if (!['approved', 'completed', 'accepted'].includes(co.status)) continue;
        coByJobsite.set(co.project_id, (coByJobsite.get(co.project_id) ?? 0) + co.cost);
      }

      // jobsite_id → { total, paid }
      const invByJobsite = new Map<string, { total: number; paid: number }>();
      for (const inv of invoices) {
        if (!inv.jobsite_id || inv.total_amount == null) continue;
        const e = invByJobsite.get(inv.jobsite_id) ?? { total: 0, paid: 0 };
        e.total += inv.total_amount;
        if (inv.status === 'paid') e.paid += inv.total_amount;
        invByJobsite.set(inv.jobsite_id, e);
      }

      let missingRates = false;

      const jobs: JobsitePnL[] = jobsites.map((js) => {
        const tsList = tsByJobsite.get(js.id) ?? [];
        let laborHours = 0;
        let laborCost = 0;
        for (const ts of tsList) {
          const hours = ts.hours_worked ?? 0;
          const rate = ts.user_id ? (rateByUser.get(ts.user_id) ?? 0) : 0;
          if (ts.user_id && !rateByUser.get(ts.user_id)) missingRates = true;
          laborHours += hours;
          laborCost += hours * rate;
        }

        const changeOrderTotal = coByJobsite.get(js.id) ?? 0;
        const invData = invByJobsite.get(js.id) ?? { total: 0, paid: 0 };
        const invoicedTotal = invData.total;
        const paidTotal = invData.paid;
        const totalCost = laborCost; // labor is the controllable cost; COs shown separately
        const grossProfit = invoicedTotal - totalCost;
        const marginPct =
          invoicedTotal > 0 ? Math.round((grossProfit / invoicedTotal) * 1000) / 10 : null;

        return {
          jobsiteId: js.id,
          jobsiteName: js.name,
          status: js.status,
          startDate: js.starting_date,
          dueDate: js.due_date,
          invoicedTotal,
          paidTotal,
          laborCost,
          laborHours: Math.round(laborHours * 10) / 10,
          changeOrderTotal,
          totalCost,
          grossProfit,
          marginPct,
        };
      });

      // Sort: jobs with invoices first (by invoiced desc), then by labor desc
      jobs.sort((a, b) => {
        if (b.invoicedTotal !== a.invoicedTotal) return b.invoicedTotal - a.invoicedTotal;
        return b.laborCost - a.laborCost;
      });

      return {
        jobs,
        totalInvoiced: jobs.reduce((s, j) => s + j.invoicedTotal, 0),
        totalPaid: jobs.reduce((s, j) => s + j.paidTotal, 0),
        totalLaborCost: jobs.reduce((s, j) => s + j.laborCost, 0),
        totalLaborHours: Math.round(jobs.reduce((s, j) => s + j.laborHours, 0) * 10) / 10,
        totalChangeOrders: jobs.reduce((s, j) => s + j.changeOrderTotal, 0),
        totalGrossProfit: jobs.reduce((s, j) => s + j.grossProfit, 0),
        missingRates,
      };
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000,
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { DailyPunch } from "./useTimeSummaryData";
import { format } from "date-fns";
import { calculateWorkedHours } from "@/lib/timeRules/calculateWorkedHours";

interface TimeSummaryDetailsParams {
  employeeId: string;
  jobsiteId: string;
  startDate: Date;
  endDate: Date;
  enabled?: boolean;
}

export const useTimeSummaryDetails = ({
  employeeId,
  jobsiteId,
  startDate,
  endDate,
  enabled = true,
}: TimeSummaryDetailsParams) => {
  const { user } = useAuth();

  // More specific cache key to ensure proper invalidation
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

  return useQuery({
    queryKey: [
      "timeSummaryDetails", 
      user?.companyId,
      employeeId, 
      jobsiteId, 
      startDateStr,
      endDateStr
    ],
    queryFn: async () => {
      if (!user?.companyId) throw new Error("No company ID");

      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      // Get timezone from company settings
      const { data: companySettings } = await supabase
        .from("company_settings")
        .select("timezone")
        .eq("company_id", user.companyId)
        .single();

      const timezone = companySettings?.timezone || "America/Toronto";

      const { data, error } = await supabase.rpc("rpc_time_summary_details", {
        p_company_id: user.companyId,
        p_employee_id: employeeId,
        p_start_date: startDateStr,
        p_end_date: endDateStr,
        p_timezone: timezone,
        p_jobsite_id: jobsiteId,
      });

      if (error) {
        console.error("Error fetching time summary details:", error);
        throw error;
      }

      // Transform the data and apply time rules
      const dailyPunches: DailyPunch[] = await Promise.all((data || []).map(async (row: any) => {
        const base: DailyPunch = {
          date: row.punch_date,
          check_in_time: row.check_in_time,
          check_out_time: row.check_out_time,
          hours_worked: parseFloat(row.hours_worked) || 0,
          jobsite_name: row.jobsite_name || "Unknown Project",
          location: null,
          status: row.status,
          jobsite_id: jobsiteId,
        };

        // Calculate time rules if punch is complete
        if (row.check_in_time && row.check_out_time) {
          try {
            const result = await calculateWorkedHours({
              rawIn: row.check_in_time,
              rawOut: row.check_out_time,
              jobsiteId: jobsiteId,
              companyId: user.companyId,
              date: row.punch_date,
            });

            return {
              ...base,
              raw_hours: result.totalMinutes / 60,
              paid_hours: result.paidMinutes / 60,
              flags: result.flags || [],
            };
          } catch (error) {
            console.error('Error calculating time rules for punch:', error);
            // Fallback to raw hours
            return {
              ...base,
              raw_hours: base.hours_worked,
              paid_hours: base.hours_worked,
              flags: [],
            };
          }
        }

        // Active punch or incomplete
        return {
          ...base,
          raw_hours: 0,
          paid_hours: 0,
          flags: [],
        };
      }));

      return dailyPunches;
    },
    enabled: enabled && !!user?.companyId && !!employeeId && !!jobsiteId,
    staleTime: 0, // Always fetch fresh data when date range changes
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

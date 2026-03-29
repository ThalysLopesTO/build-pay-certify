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

      // Fetch dismissed_flags for each timesheet
      const timesheetIds = (data || []).map((row: any) => row.id).filter(Boolean);
      let dismissedFlagsMap = new Map<string, string[]>();
      if (timesheetIds.length > 0) {
        const { data: flagsData } = await supabase
          .from('timesheets')
          .select('id, dismissed_flags')
          .in('id', timesheetIds);
        if (flagsData) {
          flagsData.forEach((row: any) => {
            dismissedFlagsMap.set(row.id, row.dismissed_flags || []);
          });
        }
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
          timesheet_id: row.id,
        };

        // Calculate time rules if punch is complete
        if (row.check_in_time && row.check_out_time) {
          try {
            // Construct full ISO timestamps from date + time
            const rawInISO = `${row.punch_date}T${row.check_in_time}:00`;
            const rawOutISO = `${row.punch_date}T${row.check_out_time}:00`;
            
            const result = await calculateWorkedHours({
              rawIn: rawInISO,
              rawOut: rawOutISO,
              jobsiteId: jobsiteId,
              companyId: user.companyId,
              date: row.punch_date,
            });

            // Use stored break_minutes override if available, otherwise use calculated
            const storedBreakMinutes = row.break_minutes;
            
            // Calculate paid hours with proper break deduction
            let paidMinutes: number;
            let finalBreakMinutes: number;

            if (storedBreakMinutes !== null && storedBreakMinutes !== undefined) {
              // Stored break takes priority - recalculate paid from raw totalMinutes
              finalBreakMinutes = storedBreakMinutes;
              paidMinutes = Math.max(0, result.totalMinutes - storedBreakMinutes);
            } else {
              // No stored break - use calculated values from time rules
              finalBreakMinutes = result.breakMinutes;
              paidMinutes = result.paidMinutes;
            }

            return {
              ...base,
              raw_hours: result.totalMinutes / 60,
              paid_hours: paidMinutes / 60,
              break_minutes: finalBreakMinutes,
              flags: result.flags || [],
              dismissed_flags: dismissedFlagsMap.get(row.id) || [],
            };
          } catch (error) {
            console.error('Error calculating time rules for punch:', error);
            // Use hours_worked from RPC as fallback
            const fallbackHours = parseFloat(row.hours_worked) || 0;
            return {
              ...base,
              raw_hours: fallbackHours,
              paid_hours: fallbackHours,
              break_minutes: 0,
              flags: [],
              dismissed_flags: dismissedFlagsMap.get(row.id) || [],
            };
          }
        }

        // Active punch or incomplete
        return {
          ...base,
          raw_hours: 0,
          paid_hours: 0,
          break_minutes: 0,
          flags: [],
          dismissed_flags: dismissedFlagsMap.get(row.id) || [],
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

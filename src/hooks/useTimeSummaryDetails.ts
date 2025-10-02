import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { DailyPunch } from "./useTimeSummaryData";
import { format } from "date-fns";

interface TimeSummaryDetailsParams {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  enabled?: boolean;
}

export const useTimeSummaryDetails = ({
  employeeId,
  startDate,
  endDate,
  enabled = true,
}: TimeSummaryDetailsParams) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["timeSummaryDetails", employeeId, startDate, endDate],
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
      });

      if (error) {
        console.error("Error fetching time summary details:", error);
        throw error;
      }

      // Transform the data to match DailyPunch interface
      const dailyPunches: DailyPunch[] = (data || []).map((row: any) => ({
        date: row.punch_date,
        check_in_time: row.check_in_time,
        check_out_time: row.check_out_time,
        hours_worked: parseFloat(row.hours_worked) || 0,
        jobsite_name: row.jobsite_name || "Unknown Project",
        location: null,
        status: row.status,
      }));

      return dailyPunches;
    },
    enabled: enabled && !!user?.companyId && !!employeeId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

// src/providers/AppProviders.tsx
import { PropsWithChildren, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/contexts/SupabaseAuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeProvider";
import { EmployeeProvider } from "@/contexts/EmployeeContext";

// (Optional) Devtools — only in development
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function AppProviders({ children }: PropsWithChildren) {
  // Soft refresh mounted queries when app regains focus or network returns.
  useEffect(() => {
    let timer: number | undefined;

    const softInvalidate = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Refresh active queries EXCEPT time-summary (has its own real-time handling)
        queryClient.invalidateQueries({ 
          refetchType: "active",
          predicate: (query) => {
            const key = query.queryKey[0];
            // Skip time-summary queries - they have dedicated real-time subscriptions
            return key !== 'time-summary' && key !== 'time-summary-raw-timesheets' && key !== 'timeSummaryDetails';
          }
        });
      }, 300);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") softInvalidate();
    };

    window.addEventListener("online", softInvalidate);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("online", softInvalidate);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Your auth session and RLS remain unchanged */}
      <AuthProvider>
        {/* RealtimeProvider stays mounted across routes (no socket tear-down) */}
        <RealtimeProvider>
          <ConditionalEmployeeProvider>
            {children}
          </ConditionalEmployeeProvider>
        </RealtimeProvider>
      </AuthProvider>

      {/* (Optional) enable while debugging cache/refetch behavior */}
      {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  );
}


function ConditionalEmployeeProvider({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();

  // While auth is loading, just render children without provider
  if (loading) return <>{children}</>;

  // Only wrap children with EmployeeProvider if role is 'employee'
  if (user?.role !== "employee") return <>{children}</>;
  return <EmployeeProvider>{children}</EmployeeProvider>;
}
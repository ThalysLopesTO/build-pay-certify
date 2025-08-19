// src/providers/AppProviders.tsx
import { PropsWithChildren, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/SupabaseAuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeProvider";

// (Optional) Devtools — only in development
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function AppProviders({ children }: PropsWithChildren) {
  // Soft refresh mounted queries when app regains focus or network returns.
  useEffect(() => {
    let timer: number | undefined;

    const softInvalidate = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Refresh ONLY active (mounted) queries to avoid noisy network traffic
        queryClient.invalidateQueries({ refetchType: "active" });
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
          {children}
        </RealtimeProvider>
      </AuthProvider>

      {/* (Optional) enable while debugging cache/refetch behavior */}
      {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  );
}

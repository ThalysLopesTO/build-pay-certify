import { PropsWithChildren, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/SupabaseAuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeProvider";

export function AppProviders({ children }: PropsWithChildren) {
  // Light global refresh on focus/online (safe + debounce)
  useEffect(() => {
    let t: any;
    const refresh = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        // Invalidate only lightweight, always-on queries if you have tags,
        // or use a general soft invalidate:
        queryClient.invalidateQueries();
      }, 300);
    };
    const onVis = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          {children}
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
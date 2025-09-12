import { QueryClient } from "@tanstack/react-query";

let _client: QueryClient | null = null;

export function getQueryClient() {
  if (_client) return _client;
  _client = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // Prevent aggressive refetching
        refetchOnReconnect: true,
        staleTime: 5 * 60 * 1000, // 5 minutes instead of 30 seconds
        retry: 3, // More retries for better resilience
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        gcTime: 10 * 60 * 1000, // Keep cache for 10 minutes
        refetchInterval: false, // Disable automatic refetching
      },
      mutations: {
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  });
  return _client;
}

export const queryClient = getQueryClient();
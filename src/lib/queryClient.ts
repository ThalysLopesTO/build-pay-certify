import { QueryClient } from "@tanstack/react-query";

let _client: QueryClient | null = null;

export function getQueryClient() {
  if (_client) return _client;
  _client = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        staleTime: 30_000,
        retry: 2,
      },
    },
  });
  return _client;
}

export const queryClient = getQueryClient();
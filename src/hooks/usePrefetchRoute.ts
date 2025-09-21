import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { queryKeys } from '@/lib/queryKeyFactory';

// Route prefetch mappings - define which queries to prefetch for each route
const ROUTE_PREFETCH_MAP = {
  'live-punch-monitor': (companyId: string) => [
    queryKeys.jobsite.list(companyId),
    queryKeys.user.profiles(companyId),
    ['live-punch-monitor', companyId, new Date(), 'all', 'all', 'all']
  ],
  'material-requests': (companyId: string) => [
    queryKeys.material.requests(companyId),
    queryKeys.jobsite.list(companyId)
  ],
  'attention-reports': (companyId: string) => [
    queryKeys.report.attention(companyId),
    queryKeys.jobsite.list(companyId)
  ],
  'timesheets': (companyId: string) => [
    queryKeys.jobsite.list(companyId),
    queryKeys.user.profiles(companyId)
  ]
};

export const usePrefetchRoute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchRoute = (routeName: string) => {
    if (!user?.companyId) return;

    const queries = ROUTE_PREFETCH_MAP[routeName as keyof typeof ROUTE_PREFETCH_MAP];
    if (!queries) return;

    const queryKeys = queries(user.companyId);
    
    // Prefetch all relevant queries for this route
    queryKeys.forEach(queryKey => {
      queryClient.prefetchQuery({
        queryKey,
        staleTime: 2 * 60 * 1000, // 2 minutes stale time for prefetched data
      });
    });
  };

  return { prefetchRoute };
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Tables } from '@/integrations/supabase/types';

// Define the enriched material request type
export type EnrichedMaterialRequest = Tables<'material_requests'> & {
  jobsites: {
    id: string;
    name: string;
    address: string | null;
  } | null;
  editableUntil?: string; // ISO string for 24h edit window end
  canEdit?: boolean;
};

export const useMaterialRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['material-requests', user?.id, user?.companyId],
    queryFn: async (): Promise<EnrichedMaterialRequest[]> => {
      if (!user?.id || !user?.companyId) {
        console.log('No user ID or company ID available');
        return [];
      }

      console.log('Fetching material requests for user:', user.id, 'company:', user.companyId);
      
      const { data, error } = await supabase
        .from('material_requests')
        .select(`
          *,
          jobsites(id, name, address)
        `)
        .eq('submitted_by', user.id)
        .eq('company_id', user.companyId)
        .order('delivery_date', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching material requests:', error);
        throw new Error(`Failed to fetch material requests: ${error.message}`);
      }

      console.log('Fetched material requests:', data);
      const now = Date.now();
      const allowedStatuses = ['pending', 'ordered'];
      const enriched = (data || []).map((req: any) => {
        const createdAt = req?.created_at ? new Date(req.created_at).getTime() : null;
        const editableUntilMs = createdAt ? createdAt + 24 * 60 * 60 * 1000 : null;
        const canEdit = Boolean(
          createdAt && editableUntilMs && now < editableUntilMs && allowedStatuses.includes((req.status || '').toLowerCase())
        );
        return {
          ...req,
          editableUntil: editableUntilMs ? new Date(editableUntilMs).toISOString() : undefined,
          canEdit,
        } as EnrichedMaterialRequest;
      });
      return enriched;
    },
    enabled: !!user?.id && !!user?.companyId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

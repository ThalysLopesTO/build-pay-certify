import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type EnrichedRequestById = Tables<'material_requests'> & {
  jobsites: { id: string; name: string; address: string | null } | null;
  editableUntil?: string;
  canEdit?: boolean;
};

export const useMaterialRequestById = (id?: string) => {
  return useQuery({
    queryKey: ['material-request', id],
    enabled: !!id,
    queryFn: async (): Promise<EnrichedRequestById | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('material_requests')
        .select(`*, jobsites(id, name, address)`) 
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const createdAt = data?.created_at ? new Date(data.created_at).getTime() : null;
      const editableUntilMs = createdAt ? createdAt + 24 * 60 * 60 * 1000 : null;
      const now = Date.now();
      const allowedStatuses = ['pending', 'ordered'];
      const canEdit = Boolean(
        createdAt && editableUntilMs && now < editableUntilMs && allowedStatuses.includes((data.status || '').toLowerCase())
      );

      return {
        ...(data as any),
        editableUntil: editableUntilMs ? new Date(editableUntilMs).toISOString() : undefined,
        canEdit,
      } as EnrichedRequestById;
    },
  });
};

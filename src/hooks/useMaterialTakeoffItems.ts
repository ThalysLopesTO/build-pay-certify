import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import type { TakeoffItemDraft } from '@/utils/takeoffItems';

export interface MaterialTakeoffItem extends TakeoffItemDraft {
  company_id: string;
  jobsite_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const TABLE = 'material_takeoff_items' as any;
const PAGE = 1000;

// The table is created by a SQL script run in the Supabase dashboard. Until
// then the list is hidden and the notes box keeps working as before.
const isMissingTable = (error: any) =>
  !!error && (error.code === 'PGRST205' || error.code === '42P01' || /material_takeoff_items/.test(error.message || '') && /does not exist|schema cache/.test(error.message || ''));

export const useMaterialTakeoffItems = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['material-takeoff-items', user?.companyId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<{ items: MaterialTakeoffItem[]; tableMissing: boolean }> => {
      if (!user?.companyId) return { items: [], tableMissing: false };
      const all: MaterialTakeoffItem[] = [];
      // Read every page so a large takeoff is never cut off by the API row cap
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from(TABLE)
          .select('*')
          .eq('company_id', user.companyId)
          .order('jobsite_id', { ascending: true })
          .order('sort_order', { ascending: true })
          .order('id', { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) {
          if (isMissingTable(error)) return { items: [], tableMissing: true };
          throw error;
        }
        const rows = (data || []) as unknown as MaterialTakeoffItem[];
        all.push(...rows.map(r => ({ ...r, quantity: Number(r.quantity) || 0 })));
        if (rows.length < PAGE) break;
      }
      return { items: all, tableMissing: false };
    },
    enabled: !!user?.companyId,
  });

  const items = query.data?.items ?? [];

  const getItemsByJobsite = (jobsiteId: string) => items.filter(i => i.jobsite_id === jobsiteId);

  // Saves the whole list for one jobsite: rows are written first, then rows
  // that were removed are deleted, so a failed save never loses the list.
  const saveItems = useMutation({
    mutationFn: async ({ jobsiteId, items: list }: { jobsiteId: string; items: TakeoffItemDraft[] }) => {
      if (!user?.companyId || !user?.id) throw new Error('User not authenticated');
      const companyId = user.companyId;

      if (list.length > 0) {
        const rows = list.map((i, index) => ({
          id: i.id,
          company_id: companyId,
          jobsite_id: jobsiteId,
          catalog_item_id: i.catalog_item_id,
          name: i.name.trim().slice(0, 300),
          sku: i.sku,
          spec_size: i.spec_size,
          unit: i.unit || 'pcs',
          category_name: i.category_name,
          quantity: i.quantity,
          notes: i.notes?.trim() ? i.notes.trim().slice(0, 1000) : null,
          sort_order: index,
          created_by: user.id,
        }));
        const { error } = await supabase.from(TABLE).upsert(rows as any, { onConflict: 'id' });
        if (error) throw error;
      }

      const keep = new Set(list.map(i => i.id));
      const { data: existing, error: readError } = await supabase
        .from(TABLE)
        .select('id')
        .eq('company_id', companyId)
        .eq('jobsite_id', jobsiteId);
      if (readError) throw readError;
      const toDelete = ((existing || []) as unknown as { id: string }[]).map(r => r.id).filter(id => !keep.has(id));
      if (toDelete.length > 0) {
        const { error } = await supabase.from(TABLE).delete().in('id', toDelete);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-takeoff-items'] });
    },
  });

  return {
    items,
    isLoading: query.isLoading,
    tableMissing: query.data?.tableMissing ?? false,
    getItemsByJobsite,
    saveItems,
  };
};

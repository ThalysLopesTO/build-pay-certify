import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface MaterialRequestLineItem {
  id: string;
  material_request_id: string;
  catalog_item_id?: string;
  quantity: number;
  unit: string;
  material_name: string;
  spec_override?: string;
  notes?: string;
  is_custom: boolean;
  line_order: number;
  created_at: string;
  catalog_item?: {
    id: string;
    name: string;
    spec_size?: string;
    unit: string;
    category: string;
  };
}

export interface CreateLineItem {
  material_request_id: string;
  catalog_item_id?: string;
  quantity: number;
  unit: string;
  material_name: string;
  spec_override?: string;
  notes?: string;
  is_custom?: boolean;
  line_order?: number;
}

export const useMaterialRequestLineItems = (materialRequestId?: string) => {
  return useQuery({
    queryKey: ['material-request-line-items', materialRequestId],
    queryFn: async () => {
      if (!materialRequestId) return [];

      const { data, error } = await supabase
        .from('material_request_line_items')
        .select(`
          *,
          catalog_item:material_catalog_items(
            id,
            name,
            spec_size,
            unit,
            category
          )
        `)
        .eq('material_request_id', materialRequestId)
        .order('line_order', { ascending: true });

      if (error) throw error;
      return data as MaterialRequestLineItem[];
    },
    enabled: !!materialRequestId,
  });
};

export const useMaterialRequestLineItemMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLineItems = useMutation({
    mutationFn: async (lineItems: CreateLineItem[]) => {
      const { data, error } = await supabase
        .from('material_request_line_items')
        .insert(lineItems)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ 
          queryKey: ['material-request-line-items', variables[0].material_request_id] 
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save line items.",
        variant: "destructive",
      });
    },
  });

  const deleteLineItems = useMutation({
    mutationFn: async (materialRequestId: string) => {
      const { error } = await supabase
        .from('material_request_line_items')
        .delete()
        .eq('material_request_id', materialRequestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-request-line-items'] });
    },
  });

  return {
    createLineItems: createLineItems.mutate,
    deleteLineItems: deleteLineItems.mutate,
    isCreating: createLineItems.isPending,
    isDeleting: deleteLineItems.isPending,
  };
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface MaterialCatalogItem {
  id: string;
  company_id: string;
  sku?: string;
  name: string;
  spec_size?: string;
  unit: string;
  category: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateMaterialCatalogItem {
  sku?: string;
  name: string;
  unit: string;
  category: string;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateMaterialCatalogItem extends Partial<CreateMaterialCatalogItem> {
  id: string;
}

export const useMaterialCatalog = (searchTerm?: string, category?: string, activeOnly?: boolean) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['material-catalog', user?.companyId, searchTerm, category, activeOnly],
    queryFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');

      let query = supabase
        .from('material_catalog_items')
        .select('*')
        .eq('company_id', user.companyId)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MaterialCatalogItem[];
    },
    enabled: !!user?.companyId,
  });
};

export const useMaterialCatalogMutations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (item: CreateMaterialCatalogItem) => {
      if (!user?.companyId || !user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('material_catalog_items')
        .insert({
          ...item,
          company_id: user.companyId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-catalog'] });
      toast({
        title: "Success!",
        description: "Material catalog item created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create material catalog item.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: UpdateMaterialCatalogItem) => {
      const { id, ...updateData } = item;
      
      const { data, error } = await supabase
        .from('material_catalog_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-catalog'] });
      toast({
        title: "Success!",
        description: "Material catalog item updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update material catalog item.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('material_catalog_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-catalog'] });
      toast({
        title: "Success!",
        description: "Material catalog item deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete material catalog item.",
        variant: "destructive",
      });
    },
  });

  return {
    createItem: createMutation.mutate,
    updateItem: updateMutation.mutate,
    deleteItem: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const MATERIAL_UNITS = [
  'pcs', 'box', 'bundle', 'roll', 'sheet', 'bag', 'ft', 'm', 'sq ft', 'sq m', 
  'lb', 'kg', 'gal', 'L', 'tube', 'pack', 'case', 'pail', 'each'
];

export const MATERIAL_CATEGORIES = [
  'Framing', 'Drywall', 'Taping', 'Fasteners', 'Insulation', 'Flooring',
  'Electrical', 'Plumbing', 'HVAC', 'Roofing', 'Siding', 'Windows & Doors',
  'Paint & Finishes', 'Hardware', 'Tools', 'Safety', 'Concrete', 'Other'
];
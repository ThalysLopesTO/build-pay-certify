import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMaterialCategories } from './useMaterialCategories';

export interface MaterialCatalogItem {
  id: string;
  company_id: string;
  sku?: string;
  name: string;
  spec_size?: string;
  unit: string;
  category: string; // UUID referencing material_categories.id
  category_name: string; // Resolved category name for display
  notes?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateMaterialCatalogItem {
  sku?: string;
  name: string;
  unit: string;
  category: string; // UUID referencing material_categories.id
  spec_size?: string;
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
        .select(`
          *,
          material_categories!inner(
            id,
            name,
            category_level,
            parent_category_id,
            material_categories!parent_category_id(name)
          )
        `)
        .eq('company_id', user.companyId)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true })
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
      
      // Transform data to include category_name
      const transformedData = data?.map(item => ({
        ...item,
        category_name: item.material_categories?.category_level === 'parent' 
          ? item.material_categories.name
          : item.material_categories?.material_categories?.name 
            ? `${item.material_categories.material_categories.name} > ${item.material_categories.name}`
            : item.material_categories?.name || 'Unknown Category'
      })) || [];
      
      return transformedData as MaterialCatalogItem[];
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

      // Ensure empty strings are converted to null to avoid unique constraint violations
      const processedItem = {
        ...item,
        sku: item.sku?.trim() || null,
        notes: item.notes?.trim() || null,
      };

      // Get the highest sort_order for this category and add 10
      const { data: maxSortOrderData } = await supabase
        .from('material_catalog_items')
        .select('sort_order')
        .eq('company_id', user.companyId)
        .eq('category', processedItem.category)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = maxSortOrderData?.[0]?.sort_order ? maxSortOrderData[0].sort_order + 10 : 10;

      const { data, error } = await supabase
        .from('material_catalog_items')
        .insert({
          ...processedItem,
          company_id: user.companyId,
          created_by: user.id,
          sort_order: nextSortOrder,
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
      
      // Ensure empty strings are converted to null to avoid unique constraint violations
      const processedUpdateData = {
        ...updateData,
        sku: updateData.sku?.trim() || null,
        notes: updateData.notes?.trim() || null,
      };
      
      const { data, error } = await supabase
        .from('material_catalog_items')
        .update(processedUpdateData)
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

  const reorderMutation = useMutation({
    mutationFn: async ({ itemId, newSortOrder }: { itemId: string; newSortOrder: number }) => {
      const { error } = await supabase
        .from('material_catalog_items')
        .update({ sort_order: newSortOrder })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-catalog'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reorder material catalog item.",
        variant: "destructive",
      });
    },
  });

  return {
    createItem: createMutation.mutate,
    updateItem: updateMutation.mutate,
    deleteItem: deleteMutation.mutate,
    reorderItem: reorderMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
};

export const MATERIAL_UNITS = [
  'pcs', 'box', 'bundle', 'roll', 'sheet', 'bag', 'ft', 'm', 'sq ft', 'sq m', 
  'lb', 'kg', 'gal', 'L', 'tube', 'pack', 'case', 'pail', 'each'
];

// Hook to get dynamic categories for the current company (legacy - returns names only)
export const useMaterialCategoriesOptions = () => {
  const { data: categories = [] } = useMaterialCategories();
  return categories.map(cat => cat.name);
};

// New hook to get categories with IDs for hierarchical selection
export const useMaterialCategoriesWithIds = () => {
  const { data: categories = [] } = useMaterialCategories();
  return categories.map(cat => ({ id: cat.id, name: cat.name }));
};
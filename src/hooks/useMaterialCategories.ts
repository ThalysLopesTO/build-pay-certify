import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "sonner";

export interface MaterialCategory {
  id: string;
  company_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  parent_category_id?: string;
  category_level: 'parent' | 'subcategory';
}

export interface CreateMaterialCategory {
  name: string;
  sort_order?: number;
  parent_category_id?: string;
  category_level?: 'parent' | 'subcategory';
}

export interface UpdateMaterialCategory {
  id: string;
  name?: string;
  sort_order?: number;
  is_active?: boolean;
}

export const useMaterialCategories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["material-categories", user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) throw new Error("No company ID");

      const { data, error } = await supabase
        .from("material_categories")
        .select("*")
        .eq("company_id", user.companyId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as MaterialCategory[];
    },
    enabled: !!user?.companyId,
  });
};

export const useMaterialCategoryMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createCategory = useMutation({
    mutationFn: async (newCategory: CreateMaterialCategory) => {
      if (!user?.companyId) throw new Error("No company ID");

      const { data, error } = await supabase
        .from("material_categories")
        .insert({
          ...newCategory,
          company_id: user.companyId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      toast.success("Category created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async (updatedCategory: UpdateMaterialCategory) => {
      const { id, ...updateData } = updatedCategory;
      
      const { data, error } = await supabase
        .from("material_categories")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      toast.success("Category updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      // First check if category is in use
      const { data: materialsUsingCategory } = await supabase
        .from("material_catalog_items")
        .select("id")
        .eq("category", categoryId)
        .limit(1);

      if (materialsUsingCategory && materialsUsingCategory.length > 0) {
        throw new Error("Cannot delete category that is in use by materials");
      }

      const { error } = await supabase
        .from("material_categories")
        .update({ is_active: false })
        .eq("id", categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });

  return {
    createCategory: createCategory.mutate,
    updateCategory: updateCategory.mutate,
    deleteCategory: deleteCategory.mutate,
    isCreating: createCategory.isPending,
    isUpdating: updateCategory.isPending,
    isDeleting: deleteCategory.isPending,
  };
}
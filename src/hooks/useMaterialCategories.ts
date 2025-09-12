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

      // Check for existing inactive category with same name
      const { data: existingCategory } = await supabase
        .from("material_categories")
        .select("*")
        .eq("company_id", user.companyId)
        .eq("name", newCategory.name)
        .eq("is_active", false)
        .maybeSingle();

      if (existingCategory) {
        // Reactivate existing category instead of creating new one
        const { data, error } = await supabase
          .from("material_categories")
          .update({
            is_active: true,
            sort_order: newCategory.sort_order,
            parent_category_id: newCategory.parent_category_id,
            category_level: newCategory.category_level,
          })
          .eq("id", existingCategory.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Create new category
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
      console.log("🗑️ Starting delete operation for category:", categoryId);
      
      try {
        // First check if category is in use by materials
        const { data: materialsUsingCategory } = await supabase
          .from("material_catalog_items")
          .select("id")
          .eq("category", categoryId)
          .limit(1);

        const isInUse = materialsUsingCategory && materialsUsingCategory.length > 0;

        // Check if this is a parent category with subcategories
        const { data: subcategories } = await supabase
          .from("material_categories")
          .select("id, name")
          .eq("parent_category_id", categoryId)
          .eq("is_active", true);

        if (subcategories && subcategories.length > 0) {
          console.log("🔍 Found subcategories to delete:", subcategories.length);
          
          // Check if any subcategories are in use
          const { data: subcategoriesInUse } = await supabase
            .from("material_catalog_items")
            .select("id")
            .in("category", subcategories.map(sub => sub.id))
            .limit(1);

          const subcategoriesAreInUse = subcategoriesInUse && subcategoriesInUse.length > 0;

          if (subcategoriesAreInUse) {
            // Soft delete subcategories and rename them to free up names
            for (const subcategory of subcategories) {
              const timestamp = Date.now();
              await supabase
                .from("material_categories")
                .update({ 
                  is_active: false,
                  name: `${subcategory.name}_deleted_${timestamp}`
                })
                .eq("id", subcategory.id);
            }
          } else {
            // Hard delete subcategories since they're not in use
            const { error: subcategoryError } = await supabase
              .from("material_categories")
              .delete()
              .in("id", subcategories.map(sub => sub.id));

            if (subcategoryError) {
              console.error("❌ Error deleting subcategories:", subcategoryError);
              throw subcategoryError;
            }
          }
          console.log("✅ Subcategories processed successfully");
        }

        // Get the category name for potential renaming
        const { data: categoryData } = await supabase
          .from("material_categories")
          .select("name")
          .eq("id", categoryId)
          .single();

        if (isInUse) {
          // Soft delete and rename to free up the name
          const timestamp = Date.now();
          const { error } = await supabase
            .from("material_categories")
            .update({ 
              is_active: false,
              name: `${categoryData?.name || 'category'}_deleted_${timestamp}`
            })
            .eq("id", categoryId);

          if (error) {
            console.error("❌ Error soft deleting category:", error);
            throw error;
          }
          console.log("✅ Category soft deleted and renamed");
        } else {
          // Hard delete since it's not in use
          const { error } = await supabase
            .from("material_categories")
            .delete()
            .eq("id", categoryId);

          if (error) {
            console.error("❌ Error hard deleting category:", error);
            throw error;
          }
          console.log("✅ Category hard deleted");
        }
        
        return { success: true };
      } catch (error) {
        console.error("❌ Delete operation failed:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log("✅ Delete mutation completed successfully for:", variables);
      // Use a small delay to prevent interference with route logic
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["material-categories"] });
        toast.success("Category deleted successfully");
      }, 100);
    },
    onError: (error: any, variables) => {
      console.error("❌ Delete mutation failed for:", variables, error);
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
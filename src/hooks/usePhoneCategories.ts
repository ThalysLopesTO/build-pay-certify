import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PhoneCategory {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePhoneCategory {
  name: string;
  description?: string;
}

export const usePhoneCategories = () => {
  const queryClient = useQueryClient();

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ["phone-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phone_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as PhoneCategory[];
    },
  });

  // Check if category is used by any phones
  const checkCategoryUsage = async (categoryId: string) => {
    const { data, error } = await supabase
      .from("company_phones")
      .select("id")
      .eq("category", categoryId)
      .limit(1);

    if (error) throw error;
    return data.length > 0;
  };

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: CreatePhoneCategory) => {
      const { data, error } = await supabase
        .from("phone_categories")
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone-categories"] });
      toast.success("Category created successfully");
    },
    onError: (error: any) => {
      console.error("Error creating category:", error);
      if (error.code === "23505") {
        toast.error("A category with this name already exists");
      } else {
        toast.error("Failed to create category");
      }
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...categoryData }: Partial<PhoneCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("phone_categories")
        .update(categoryData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone-categories"] });
      queryClient.invalidateQueries({ queryKey: ["company-phones"] });
      toast.success("Category updated successfully");
    },
    onError: (error: any) => {
      console.error("Error updating category:", error);
      if (error.code === "23505") {
        toast.error("A category with this name already exists");
      } else {
        toast.error("Failed to update category");
      }
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      // Check if category is in use
      const isInUse = await checkCategoryUsage(categoryId);
      if (isInUse) {
        throw new Error("Cannot delete category that is in use");
      }

      const { error } = await supabase
        .from("phone_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone-categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: any) => {
      console.error("Error deleting category:", error);
      if (error.message.includes("in use")) {
        toast.error("Cannot delete category that is being used by phone contacts");
      } else {
        toast.error("Failed to delete category");
      }
    },
  });

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
    checkCategoryUsage,
  };
};
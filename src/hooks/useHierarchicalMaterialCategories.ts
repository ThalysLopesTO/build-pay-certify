import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface HierarchicalMaterialCategory {
  id: string;
  company_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  category_level: 'parent' | 'subcategory';
  parent_category_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  subcategories?: HierarchicalMaterialCategory[];
}

export const useHierarchicalMaterialCategories = () => {
  const { user } = useAuth();

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ["material-categories", user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) throw new Error("No company ID");

      const { data, error } = await supabase
        .from('material_categories')
        .select('*')
        .eq('company_id', user.companyId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as HierarchicalMaterialCategory[];
    },
    enabled: !!user?.companyId,
  });

  const getParentCategories = useMemo(() => {
    return categories.filter(cat => cat.category_level === 'parent');
  }, [categories]);

  const getSubcategoriesForParent = (parentId: string) => {
    return categories.filter(cat => 
      cat.category_level === 'subcategory' && 
      cat.parent_category_id === parentId
    );
  };

  const getCategoryDisplay = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return 'Unknown Category';

    if (category.category_level === 'parent') {
      return category.name;
    } else {
      const parent = categories.find(cat => cat.id === category.parent_category_id);
      return parent ? `${parent.name} > ${category.name}` : category.name;
    }
  };

  const organizedCategories = useMemo(() => {
    const parentCategories = getParentCategories.map(parent => ({
      ...parent,
      subcategories: getSubcategoriesForParent(parent.id)
    }));
    return parentCategories;
  }, [getParentCategories, categories]);

  return {
    categories,
    loading,
    getParentCategories,
    getSubcategoriesForParent,
    getCategoryDisplay,
    organizedCategories
  };
};
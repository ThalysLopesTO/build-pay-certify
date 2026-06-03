import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface HierarchicalCategory {
  id: string;
  name: string;
  category_level: 'parent' | 'subcategory';
  parent_category_id?: string;
  sort_order: number;
  category_type: 'income' | 'expense' | 'both';
  subcategories?: HierarchicalCategory[];
}

export interface TransactionWithHierarchy {
  id: string;
  expense_title: string;
  vendor_payee: string;
  expense_date: string;
  amount: number;
  payment_status: 'paid' | 'unpaid' | 'scheduled';
  payment_method?: string;
  notes?: string;
  attachment_url?: string;
  is_recurring?: boolean;
  recurrence_frequency?: string;
  parent_recurring_bill_id?: string;
  category_id: string;
  parent_category_name: string;
  subcategory_name?: string;
  category_level: 'parent' | 'subcategory';
  transaction_type: 'income' | 'expense';
}

// Keep for backward compatibility
export interface ExpenseWithHierarchy extends TransactionWithHierarchy {}

export const useHierarchicalCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<HierarchicalCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async (categoryType?: 'income' | 'expense' | 'both') => {
    if (!user?.companyId) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('expense_categories')
        .select('*')
        .eq('company_id', user.companyId);

      if (categoryType) {
        query = query.or(`category_type.eq.${categoryType},category_type.eq.both`);
      }

      const { data, error } = await query
        .order('category_level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionsWithHierarchy = async (transactionType?: 'income' | 'expense'): Promise<TransactionWithHierarchy[]> => {
    if (!user?.companyId) return [];

    try {
      // Fetch transactions and all categories in parallel (single round-trip each).
      // Category name resolution is done in-memory below to avoid an N+1 query per row.
      let txQuery = supabase
        .from('bills_expenses')
        .select(`
          id,
          expense_title,
          vendor_payee,
          expense_date,
          amount,
          payment_status,
          payment_method,
          notes,
          attachment_url,
          is_recurring,
          recurrence_frequency,
          parent_recurring_bill_id,
          category_id,
          transaction_type,
          expense_categories!category_id (
            id,
            name,
            category_level,
            parent_category_id
          )
        `)
        .eq('company_id', user.companyId);

      if (transactionType) {
        txQuery = txQuery.eq('transaction_type', transactionType);
      }

      const [{ data, error }, { data: allCategories }] = await Promise.all([
        txQuery.order('expense_date', { ascending: false }),
        supabase
          .from('expense_categories')
          .select('id, name')
          .eq('company_id', user.companyId),
      ]);

      if (error) throw error;

      // Build a fast lookup for parent category names.
      const categoryNameById = new Map<string, string>();
      (allCategories || []).forEach((cat: { id: string; name: string }) => {
        categoryNameById.set(cat.id, cat.name);
      });

      const expensesWithHierarchy: TransactionWithHierarchy[] = (data || []).map((expense: any) => {
        const category = expense.expense_categories;

        const base = {
          id: expense.id,
          expense_title: expense.expense_title,
          vendor_payee: expense.vendor_payee,
          expense_date: expense.expense_date,
          amount: expense.amount,
          payment_status: expense.payment_status,
          payment_method: expense.payment_method,
          notes: expense.notes,
          attachment_url: expense.attachment_url,
          is_recurring: expense.is_recurring,
          recurrence_frequency: expense.recurrence_frequency,
          parent_recurring_bill_id: expense.parent_recurring_bill_id,
          category_id: expense.category_id,
          transaction_type: expense.transaction_type,
        };

        // Handle uncategorized transactions (null category)
        if (!category) {
          return {
            ...base,
            parent_category_name: 'Uncategorized',
            subcategory_name: null,
            category_level: 'parent' as const,
          };
        }

        let parentCategoryName = category.name;
        let subcategoryName = null;

        // If this is a subcategory, resolve the parent name from the in-memory map
        if (category.category_level === 'subcategory' && category.parent_category_id) {
          const resolvedParent = categoryNameById.get(category.parent_category_id);
          if (resolvedParent) {
            parentCategoryName = resolvedParent;
            subcategoryName = category.name;
          }
        }

        return {
          ...base,
          parent_category_name: parentCategoryName,
          subcategory_name: subcategoryName,
          category_level: category.category_level,
        };
      });

      return expensesWithHierarchy;
    } catch (error) {
      console.error('Error fetching expenses with hierarchy:', error);
      return [];
    }
  };

  const getParentCategories = (categoryType?: 'income' | 'expense') => {
    return categories.filter(cat => 
      cat.category_level === 'parent' && 
      (!categoryType || cat.category_type === categoryType || cat.category_type === 'both')
    );
  };

  const getSubcategoriesForParent = (parentId: string) => {
    return categories.filter(cat => 
      cat.category_level === 'subcategory' && cat.parent_category_id === parentId
    );
  };

  const getCategoryDisplay = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return '';

    if (category.category_level === 'parent') {
      return category.name;
    } else {
      // For subcategory, show "Parent > Subcategory"
      const parentCategory = categories.find(cat => cat.id === category.parent_category_id);
      return parentCategory ? `${parentCategory.name} > ${category.name}` : category.name;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user?.companyId]);

  // Backward compatibility
  const getExpensesWithHierarchy = () => getTransactionsWithHierarchy('expense');

  return {
    categories,
    isLoading,
    fetchCategories,
    getTransactionsWithHierarchy,
    getExpensesWithHierarchy, // Keep for backward compatibility
    getParentCategories,
    getSubcategoriesForParent,
    getCategoryDisplay,
  };
};
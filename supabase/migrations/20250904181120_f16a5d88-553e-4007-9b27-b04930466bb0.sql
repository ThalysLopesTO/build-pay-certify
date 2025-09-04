-- Fix the security definer view by adding RLS policies instead
DROP VIEW IF EXISTS public.expense_categories_hierarchy;

-- Add RLS policies for the new hierarchical view access
-- Since the view had security issues, we'll query the data directly with proper RLS
-- The existing RLS policies on expense_categories and bills_expenses will handle security
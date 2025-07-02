-- Drop and recreate the get_material_takeoffs_paginated function to remove status-related fields
DROP FUNCTION IF EXISTS public.get_material_takeoffs_paginated(uuid,uuid,text,text,text,integer,integer);

CREATE OR REPLACE FUNCTION public.get_material_takeoffs_paginated(
  p_company_id uuid, 
  p_jobsite_id uuid DEFAULT NULL::uuid, 
  p_search text DEFAULT NULL::text, 
  p_status text DEFAULT NULL::text, -- Keep this parameter for backward compatibility but ignore it
  p_category text DEFAULT NULL::text, 
  p_page integer DEFAULT 1, 
  p_limit integer DEFAULT 25
)
RETURNS TABLE(
  id uuid, 
  jobsite_id uuid, 
  company_id uuid, 
  material_name text, 
  unit text, 
  total_qty_estimated numeric, 
  unit_price numeric, 
  subtotal numeric, 
  vendor text, 
  notes text, 
  category text, 
  priority integer, 
  is_draft boolean, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  created_by uuid, 
  jobsite_name text, 
  jobsite_address text, 
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  offset_value integer;
BEGIN
  offset_value := (p_page - 1) * p_limit;
  
  RETURN QUERY
  SELECT 
    mt.id,
    mt.jobsite_id,
    mt.company_id,
    mt.material_name,
    mt.unit,
    mt.total_qty_estimated,
    mt.unit_price,
    mt.subtotal,
    mt.vendor,
    mt.notes,
    mt.category,
    mt.priority,
    mt.is_draft,
    mt.created_at,
    mt.updated_at,
    mt.created_by,
    j.name as jobsite_name,
    j.address as jobsite_address,
    COUNT(*) OVER() as total_count
  FROM public.material_takeoffs mt
  LEFT JOIN public.jobsites j ON j.id = mt.jobsite_id
  WHERE mt.company_id = p_company_id
    AND (p_jobsite_id IS NULL OR mt.jobsite_id = p_jobsite_id)
    AND (p_search IS NULL OR mt.material_name ILIKE '%' || p_search || '%')
    AND (p_category IS NULL OR mt.category = p_category)
  ORDER BY mt.priority DESC, mt.created_at DESC
  LIMIT p_limit
  OFFSET offset_value;
END;
$$;
-- Update material takeoffs table for better performance
-- Add indexes for pagination and filtering
CREATE INDEX IF NOT EXISTS idx_material_takeoffs_company_jobsite ON public.material_takeoffs(company_id, jobsite_id);
CREATE INDEX IF NOT EXISTS idx_material_takeoffs_material_name ON public.material_takeoffs(material_name);
CREATE INDEX IF NOT EXISTS idx_material_takeoffs_status ON public.material_takeoffs(status);
CREATE INDEX IF NOT EXISTS idx_material_takeoffs_created_at ON public.material_takeoffs(created_at);

-- Add a function to handle bulk material takeoff operations
CREATE OR REPLACE FUNCTION public.bulk_insert_material_takeoffs(
  takeoffs_data jsonb
) RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_count integer := 0;
  error_count integer := 0;
  result jsonb;
  takeoff_item jsonb;
BEGIN
  -- Loop through each takeoff item
  FOR takeoff_item IN SELECT * FROM jsonb_array_elements(takeoffs_data)
  LOOP
    BEGIN
      -- Insert each takeoff item
      INSERT INTO public.material_takeoffs (
        jobsite_id,
        company_id,
        material_name,
        unit,
        total_qty_estimated,
        unit_price,
        created_by
      ) VALUES (
        (takeoff_item->>'jobsite_id')::uuid,
        (takeoff_item->>'company_id')::uuid,
        takeoff_item->>'material_name',
        takeoff_item->>'unit',
        (takeoff_item->>'total_qty_estimated')::numeric,
        (takeoff_item->>'unit_price')::numeric,
        (takeoff_item->>'created_by')::uuid
      );
      
      inserted_count := inserted_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
    END;
  END LOOP;
  
  -- Return summary
  result := jsonb_build_object(
    'inserted_count', inserted_count,
    'error_count', error_count,
    'total_processed', inserted_count + error_count
  );
  
  RETURN result;
END;
$$;

-- Add a function for paginated material takeoffs query
CREATE OR REPLACE FUNCTION public.get_material_takeoffs_paginated(
  p_company_id uuid,
  p_jobsite_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 25
) RETURNS TABLE (
  id uuid,
  jobsite_id uuid,
  company_id uuid,
  material_name text,
  unit text,
  total_qty_estimated numeric,
  unit_price numeric,
  subtotal numeric,
  requested_qty numeric,
  remaining_qty numeric,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  created_by uuid,
  jobsite_name text,
  jobsite_address text,
  total_count bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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
    mt.requested_qty,
    mt.remaining_qty,
    mt.status,
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
    AND (p_status IS NULL OR mt.status = p_status)
  ORDER BY mt.created_at DESC
  LIMIT p_limit
  OFFSET offset_value;
END;
$$;
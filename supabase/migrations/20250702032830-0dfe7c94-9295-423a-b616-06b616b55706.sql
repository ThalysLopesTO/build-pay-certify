-- Add bulk operations and pagination functions for material takeoffs

-- Function to handle bulk material takeoff operations
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
        created_by,
        vendor,
        notes,
        category,
        priority
      ) VALUES (
        (takeoff_item->>'jobsite_id')::uuid,
        (takeoff_item->>'company_id')::uuid,
        takeoff_item->>'material_name',
        takeoff_item->>'unit',
        (takeoff_item->>'total_qty_estimated')::numeric,
        (takeoff_item->>'unit_price')::numeric,
        (takeoff_item->>'created_by')::uuid,
        takeoff_item->>'vendor',
        takeoff_item->>'notes',
        takeoff_item->>'category',
        COALESCE((takeoff_item->>'priority')::integer, 1)
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

-- Function for paginated material takeoffs query
CREATE OR REPLACE FUNCTION public.get_material_takeoffs_paginated(
  p_company_id uuid,
  p_jobsite_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_category text DEFAULT NULL,
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
  vendor text,
  notes text,
  category text,
  priority integer,
  is_draft boolean,
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
    AND (p_status IS NULL OR mt.status = p_status)
    AND (p_category IS NULL OR mt.category = p_category)
  ORDER BY mt.priority DESC, mt.created_at DESC
  LIMIT p_limit
  OFFSET offset_value;
END;
$$;

-- Function for bulk updates
CREATE OR REPLACE FUNCTION public.bulk_update_material_takeoffs(
  takeoff_ids uuid[],
  updates jsonb
) RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  -- Update all specified takeoffs
  UPDATE public.material_takeoffs 
  SET 
    material_name = COALESCE(updates->>'material_name', material_name),
    unit = COALESCE(updates->>'unit', unit),
    total_qty_estimated = COALESCE((updates->>'total_qty_estimated')::numeric, total_qty_estimated),
    unit_price = COALESCE((updates->>'unit_price')::numeric, unit_price),
    vendor = COALESCE(updates->>'vendor', vendor),
    notes = COALESCE(updates->>'notes', notes),
    category = COALESCE(updates->>'category', category),
    priority = COALESCE((updates->>'priority')::integer, priority),
    status = COALESCE(updates->>'status', status),
    updated_at = now()
  WHERE id = ANY(takeoff_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function for bulk delete
CREATE OR REPLACE FUNCTION public.bulk_delete_material_takeoffs(
  takeoff_ids uuid[]
) RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  DELETE FROM public.material_takeoffs 
  WHERE id = ANY(takeoff_ids);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
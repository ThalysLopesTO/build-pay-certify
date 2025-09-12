-- Add sort_order field to material_catalog_items table
ALTER TABLE public.material_catalog_items 
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Update existing items to have incremental sort_order values within each category
WITH numbered_items AS (
  SELECT 
    id, 
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY name) as row_num 
  FROM public.material_catalog_items
)
UPDATE public.material_catalog_items 
SET sort_order = numbered_items.row_num * 10
FROM numbered_items 
WHERE public.material_catalog_items.id = numbered_items.id;
-- Add hierarchical structure to material_categories
ALTER TABLE public.material_categories 
ADD COLUMN parent_category_id UUID REFERENCES public.material_categories(id),
ADD COLUMN category_level TEXT NOT NULL DEFAULT 'parent' CHECK (category_level IN ('parent', 'subcategory'));

-- Update material_catalog_items to use UUID foreign key instead of text
ALTER TABLE public.material_catalog_items 
ADD COLUMN category_id UUID REFERENCES public.material_categories(id);

-- Migrate existing text categories to new category records
DO $$
DECLARE
    item_record RECORD;
    category_uuid UUID;
BEGIN
    -- Create parent categories from existing unique category names
    INSERT INTO public.material_categories (company_id, name, sort_order, category_level, created_by)
    SELECT DISTINCT 
        company_id,
        category as name,
        ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY category) as sort_order,
        'parent' as category_level,
        created_by
    FROM public.material_catalog_items 
    WHERE category IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- Update material_catalog_items to reference the new category UUIDs
    FOR item_record IN 
        SELECT id, company_id, category, created_by
        FROM public.material_catalog_items 
        WHERE category IS NOT NULL
    LOOP
        -- Find the matching category UUID
        SELECT mc.id INTO category_uuid
        FROM public.material_categories mc
        WHERE mc.company_id = item_record.company_id 
        AND mc.name = item_record.category
        AND mc.category_level = 'parent'
        LIMIT 1;

        -- Update the item with the category UUID
        IF category_uuid IS NOT NULL THEN
            UPDATE public.material_catalog_items 
            SET category_id = category_uuid
            WHERE id = item_record.id;
        END IF;
    END LOOP;
END $$;

-- Drop the old text category column after migration
ALTER TABLE public.material_catalog_items 
DROP COLUMN category;

-- Rename category_id to category for consistency
ALTER TABLE public.material_catalog_items 
RENAME COLUMN category_id TO category;

-- Make category field NOT NULL now that migration is complete
ALTER TABLE public.material_catalog_items 
ALTER COLUMN category SET NOT NULL;
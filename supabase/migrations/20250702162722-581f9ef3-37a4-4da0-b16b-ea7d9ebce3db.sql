-- Remove Material Request integration from Material Takeoffs
-- This makes Material Takeoff a standalone planning tool

-- Remove request-related columns from material_takeoffs table (with CASCADE)
ALTER TABLE public.material_takeoffs 
DROP COLUMN IF EXISTS requested_qty CASCADE,
DROP COLUMN IF EXISTS remaining_qty CASCADE,
DROP COLUMN IF EXISTS status CASCADE;

-- Update RLS policies to restrict access to admins only
DROP POLICY IF EXISTS "Users can view takeoffs for their company" ON public.material_takeoffs;

-- Only admins can manage material takeoffs
CREATE POLICY "Admins can manage takeoffs for their company" 
ON public.material_takeoffs 
FOR ALL 
USING (
  company_id IN ( 
    SELECT user_profiles.company_id
    FROM user_profiles
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  )
);

-- Update the trigger function to calculate subtotal properly
CREATE OR REPLACE FUNCTION public.calculate_material_takeoff_subtotal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate subtotal based on estimated quantity and unit price
  NEW.subtotal := NEW.total_qty_estimated * NEW.unit_price;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic subtotal calculation
DROP TRIGGER IF EXISTS calculate_takeoff_subtotal ON public.material_takeoffs;
CREATE TRIGGER calculate_takeoff_subtotal
  BEFORE INSERT OR UPDATE ON public.material_takeoffs
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_material_takeoff_subtotal();
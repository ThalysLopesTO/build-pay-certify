-- Check current status constraint and update to allow required values
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'timesheets_status_check' 
    AND table_name = 'timesheets'
  ) THEN
    ALTER TABLE public.timesheets DROP CONSTRAINT timesheets_status_check;
  END IF;
  
  -- Add updated constraint with required status values
  ALTER TABLE public.timesheets 
  ADD CONSTRAINT timesheets_status_check 
  CHECK (status IN ('active', 'completed', 'pending', 'approved', 'rejected'));
END $$;
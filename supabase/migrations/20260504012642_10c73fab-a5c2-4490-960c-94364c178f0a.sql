ALTER TABLE public.manual_timesheets
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approval_comment text,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_by_name text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'manual_timesheets_approval_status_chk'
  ) THEN
    ALTER TABLE public.manual_timesheets
      ADD CONSTRAINT manual_timesheets_approval_status_chk
      CHECK (approval_status IN ('pending','approved','declined'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_manual_timesheets_approval_status
  ON public.manual_timesheets(company_id, approval_status);

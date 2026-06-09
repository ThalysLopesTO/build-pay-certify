-- Employee reimbursement bills
CREATE TABLE public.employee_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  jobsite_id uuid,
  timesheet_id uuid,
  amount numeric,
  description text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employee_bill_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.employee_bills(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_employee_bills_company ON public.employee_bills(company_id);
CREATE INDEX idx_employee_bills_user ON public.employee_bills(user_id);
CREATE INDEX idx_employee_bill_photos_bill ON public.employee_bill_photos(bill_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_bills TO authenticated;
GRANT ALL ON public.employee_bills TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_bill_photos TO authenticated;
GRANT ALL ON public.employee_bill_photos TO service_role;

-- RLS
ALTER TABLE public.employee_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_bill_photos ENABLE ROW LEVEL SECURITY;

-- employee_bills policies
CREATE POLICY "Employees can view own bills, admins view company bills"
ON public.employee_bills FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = ANY (ARRAY['admin','super_admin','foreman','management'])
      AND user_profiles.company_id = employee_bills.company_id
  )
);

CREATE POLICY "Employees can create their own bills"
ON public.employee_bills FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update company bills"
ON public.employee_bills FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = ANY (ARRAY['admin','super_admin','management'])
      AND user_profiles.company_id = employee_bills.company_id
  )
);

CREATE POLICY "Owners and admins can delete bills"
ON public.employee_bills FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = ANY (ARRAY['admin','super_admin','management'])
      AND user_profiles.company_id = employee_bills.company_id
  )
);

-- employee_bill_photos policies (access mirrors parent bill)
CREATE POLICY "View bill photos if can view bill"
ON public.employee_bill_photos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employee_bills b
    WHERE b.id = employee_bill_photos.bill_id
      AND (
        b.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = ANY (ARRAY['admin','super_admin','foreman','management'])
            AND user_profiles.company_id = b.company_id
        )
      )
  )
);

CREATE POLICY "Insert bill photos for own bills"
ON public.employee_bill_photos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employee_bills b
    WHERE b.id = employee_bill_photos.bill_id
      AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Delete bill photos if can delete bill"
ON public.employee_bill_photos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employee_bills b
    WHERE b.id = employee_bill_photos.bill_id
      AND (
        b.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = ANY (ARRAY['admin','super_admin','management'])
            AND user_profiles.company_id = b.company_id
        )
      )
  )
);

-- updated_at trigger
CREATE TRIGGER update_employee_bills_updated_at
BEFORE UPDATE ON public.employee_bills
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Create Govan Brown company with Pro plan
INSERT INTO public.companies (
  id,
  name,
  plan_type,
  employee_limit,
  expiration_date,
  status,
  subscription_status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Govan Brown',
  'pro',
  50,
  '2026-09-02',
  'active',
  'active',
  now(),
  now()
);
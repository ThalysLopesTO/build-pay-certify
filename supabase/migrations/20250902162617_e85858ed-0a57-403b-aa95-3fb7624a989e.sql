-- Get the company ID first for Govan Brown
WITH new_company AS (
  INSERT INTO public.companies (
    id,
    name,
    plan,
    employee_limit,
    expiration_date,
    status,
    subscription_status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'Govan Brown',
    'starter',
    50,
    '2026-09-02',
    'active',
    'active',
    now(),
    now()
  ) RETURNING id, name
)
SELECT id, name FROM new_company;
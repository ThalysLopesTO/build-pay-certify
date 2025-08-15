-- Update the company name to "Ground Zero" for the company with ID 1c58ddd5-63fb-4cfc-8e82-d6cd4d646d33
UPDATE public.companies 
SET name = 'Ground Zero',
    updated_at = now()
WHERE id = '1c58ddd5-63fb-4cfc-8e82-d6cd4d646d33';
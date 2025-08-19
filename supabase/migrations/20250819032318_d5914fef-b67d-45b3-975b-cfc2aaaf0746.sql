-- Update existing Pro plan companies to have 50 employee limit instead of 20
UPDATE companies 
SET employee_limit = 50 
WHERE plan = 'pro' AND employee_limit = 20;


# Update Employee Limit for Ground Zero (vida6ix@gmail.com)

## Problem
The company **Ground Zero** (ID: `1c58ddd5-63fb-4cfc-8e82-d6cd4d646d33`) currently has `employee_limit = 50` and `plan = 'free'`. The previous migration only updated companies on `builder_pro`, so this company was missed.

## Fix
Run a database migration to set the employee limit to **80** for this specific company:

```sql
UPDATE public.companies 
SET employee_limit = 80 
WHERE id = '1c58ddd5-63fb-4cfc-8e82-d6cd4d646d33';
```

Single migration file, no code changes needed.


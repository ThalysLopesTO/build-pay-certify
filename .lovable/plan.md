

# Increase Builder Pro Employee Limit to 80

## Change
Update the `builder_pro` plan's `employeeLimit` from 50 to 80 in `src/config/subscriptionPlans.ts`, and update the corresponding `featureList` text from "50 Employee accounts" to "80 Employee accounts".

## File
**`src/config/subscriptionPlans.ts`** — 2 line changes:
- Line with `employeeLimit: 50` → `employeeLimit: 80`
- Line with `'50 Employee accounts (excl. admin)'` → `'80 Employee accounts (excl. admin)'`

Note: Existing companies on this plan will also need their `employee_limit` column updated in the database (from 50 to 80) via a migration.


# Create Manual Timesheets — Marcos Baggio

Insert 2 weekly manual timesheets (matching the existing 7-day pattern in the DB) for Marcos Baggio at Ground Zero.

## Employee & project
- Employee: Marcos Baggio (`bde63e76-b0dd-4166-8b88-dc188559c430`, user `bffbbd7c-52ee-47f1-82d9-e5f3e24ca1a4`)
- Company: Ground Zero (`1c58ddd5-63fb-4cfc-8e82-d6cd4d646d33`)
- Jobsite: Equitable Bank (`71156898-7d32-485e-9643-e40c4f86a08e`)
- Role: Framer
- Hourly rate: $45.00 (override of profile rate)
- Tax: 0%
- Approval status: `pending`
- `created_by`: Marcos's own user_id (no admin session available server-side)

## Week 1 — Jul 3–9, 2026 (46 hrs)
Fri 8, Sat 0, Sun 0, Mon 8, Tue 14, Wed 8, Thu 8 → 46h × $45 = **$2,070.00**

## Week 2 — Jul 10–16, 2026 (42 hrs)
Fri 8, Sat 8, Sun 0, Mon 8, Tue 10, Wed 8, Thu 0 → 42h × $45 = **$1,890.00**

Combined: **88 hrs / $3,960.00** ✓

## Technical
Two `INSERT INTO public.manual_timesheets` rows via `supabase--insert`, populating `daily_hours` jsonb (`[{date, day, hours}, …]`), `pay_period_start/end`, `total_hours`, `hourly_rate`, `subtotal`, `total_payment`, `employee_role='Framer'`, `project_name='Equitable Bank'`, and the IDs above.

## Assumption
Year = **2026** (current). Confirm if you meant 2025.

# Single 14-day Manual Timesheets — Jul 3 to Jul 16, 2026

Going forward every employee you send will get **one** manual timesheet spanning Jul 3 – Jul 16, 2026 (14 days) instead of two weekly rows.

## Cleanup for Marcos Baggio
Delete the two weekly rows I just inserted (Jul 3–9 and Jul 10–16) and replace them with one 14-day timesheet.

## Marcos Baggio — Jul 3–16, 2026
- Company: Ground Zero
- Employee: Marcos Baggio
- Jobsite: Equitable Bank
- Role: Framer
- Rate: $45.00/hr, Tax: 0%
- `daily_hours` jsonb: 14 entries, one per day
  - Jul 3 Fri 8, Jul 4 Sat 0, Jul 5 Sun 0, Jul 6 Mon 8, Jul 7 Tue 14, Jul 8 Wed 8, Jul 9 Thu 8,
  - Jul 10 Fri 8, Jul 11 Sat 8, Jul 12 Sun 0, Jul 13 Mon 8, Jul 14 Tue 10, Jul 15 Wed 8, Jul 16 Thu 0
- Total: **88 hrs**, Subtotal / Total payment: **$3,960.00**
- Status: `pending`

## Process for the rest of the list
When you send the employee list, for each employee I'll:
1. Look up the `user_profiles` row and confirm company + jobsite match.
2. Insert one `manual_timesheets` row with `pay_period_start = 2026-07-03`, `pay_period_end = 2026-07-16`, and the 14-day `daily_hours` array.
3. Reply with a confirmation of hours and payment.

## Assumption
Year = **2026**. Say the word if it should be 2025 and I'll adjust before inserting.

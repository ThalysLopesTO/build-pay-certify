# Architecture rules

- All Timesheets derives payroll totals from stored final payments after filtering and before display pagination; fetch every authorized list and folder-membership page so API row caps cannot silently understate payroll.
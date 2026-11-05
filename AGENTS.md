# Architecture rules

- All Timesheets derives payroll totals from stored final payments after filtering and before display pagination; fetch every authorized list and folder-membership page so API row caps cannot silently understate payroll.
- Invoice and quote action menus are non-modal when opening dialogs; let dialogs close before unmounting their parent and cancel stale cleanup timers on reopening to prevent inherited page locks.
- Email delivery waits are bounded without automatically retrying unknown timeout results, because the original request may already have delivered.
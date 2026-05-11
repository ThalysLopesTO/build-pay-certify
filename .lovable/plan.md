Add an editable **Notes** field to the Punch Edit modal used by the Daily Hours Summary breakdown.

### File
`src/components/admin/live-punch-monitor/PunchEditModal.tsx`

### Changes
1. Add `note` state (string), initialized from `punch.note ?? ''` inside the existing `useEffect`.
2. Render a `<Textarea>` ("Notes") below the Break Time section.
3. Include `work_note: note.trim() || null` in the `mutation.mutate` payload.

### Why no backend work
- `usePunchEdit` already accepts and writes `work_note`.
- Foremen, managers, and admins already see the Edit button in the breakdown (existing `canEdit` rule), so no permission changes are needed.

### Verification
Open Daily Hours Summary → Edit a punch → Notes textarea is prefilled → change & Save → updated note appears in the breakdown row.
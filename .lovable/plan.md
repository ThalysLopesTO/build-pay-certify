

# Add Break Time Presets to Punch Edit Modal

## Change
**File: `src/components/admin/live-punch-monitor/PunchEditModal.tsx`**

Replace the plain numeric input for break minutes (lines 105-113) with preset buttons (15 min, 30 min, 40 min) plus a "Custom" option that reveals the numeric input. This matches the existing pattern used in `EditPunchModal.tsx`.

- Add `isCustomBreak` state
- Add `BREAK_PRESETS` array: `[{label: '15 min', value: 15}, {label: '30 min', value: 30}, {label: '40 min', value: 40}]`
- Preset buttons toggle selection (clicking selected preset clears it to 0)
- "Custom" button shows the numeric input for arbitrary values
- Import `Coffee` icon for the label, matching the other modal's style

| File | Action |
|------|--------|
| `PunchEditModal.tsx` | Replace break input with preset buttons + custom option |


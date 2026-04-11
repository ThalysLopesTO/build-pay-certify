

# Polish Live Punch Table to Match Untitled UI Reference

## Summary
Visual refinements to make the existing table match the clean, minimal Untitled UI style shown in the reference image. No structural or logic changes.

## Changes in `src/components/admin/live-punch-monitor/LivePunchTable.tsx`

### Row styling
- Remove alternating row background (`bg-muted/30` on odd rows) -- all rows should be white/transparent with only border-b separators
- Keep hover state `hover:bg-muted/50` and selected/flagged highlighting

### Status badges
- Simplify to match reference: green dot + "Active" text with minimal border, no icon for "Complete" -- just a neutral dot + text
- Remove `CheckCircle` icon from Complete badge, use a simple gray/blue dot instead

### Pagination
- Restyle to match reference: left side shows "Page X of Y" + items-per-page selector, right side shows "Previous" / "Next" buttons with outlined style
- Remove numbered page buttons (the reference only has Previous/Next)
- Add a simple per-page dropdown (10, 25, 50)

### Actions column
- Remove separate Flag and Location columns -- merge into Actions column as icon buttons to reduce column count and match the compact 2-icon pattern in the reference
- Keep delete (trash) and edit (pencil) as primary action icons

### Header
- Keep existing `TableCard.Header` with title + badge + Live indicator -- already matches reference style

## Files

| File | Action |
|------|--------|
| `src/components/admin/live-punch-monitor/LivePunchTable.tsx` | Modify styling, merge columns, restyle pagination |

## What does NOT change
- No logic, data, hook, or query changes
- Mobile card layout unchanged
- All modals, handlers, and permissions preserved


## Employee Bills Page UI Enhancement

### Goal
Redesign the Employee Bills management page with a mobile-first responsive layout, improved receipt thumbnail previews, and clearer status badges that allow admins/managers to scan and act on reimbursement requests quickly.

---

### 1. Mobile-First Responsive Layout
Replace the single rigid HTML `<table>` with a responsive dual-mode layout:

- **Mobile (below 768px):** Stacked card list. Each bill becomes a self-contained card showing the receipt thumbnail, employee info, amount, status badge, and action buttons arranged vertically for thumb-friendly tapping.
- **Tablet/Desktop (768px+):** A clean, breathable table with generous cell padding and sticky action column.

Use `useIsMobile()` (already in the project) to switch between card and table views. Cards use the existing `TableCard` container for visual consistency.

### 2. Better Thumbnail Preview
Upgrade the receipt thumbnail experience:

- Increase thumbnail size from 48px to 64px with rounded corners and a subtle shadow.
- Add a lightbox-style photo gallery modal (replaces current basic dialog) with:
  - Larger image display with swipe/click navigation
  - Photo counter (e.g., "2 / 4")
  - Open-in-new-tab link
  - Keyboard arrow navigation
- Show a small photo strip of all thumbnails in the lightbox when a bill has multiple photos, allowing direct jumps.
- On cards, show up to 3 thumbnail dots if multiple photos exist; clicking any opens the gallery at that index.

### 3. Clearer Status Badges for Quick Review
Redesign the status indicators to be scannable at a glance:

- Switch from `type="solid"` with hardcoded hex colors to the project's standard `BadgeWithDot` semantic palette:
  - `pending`  → `color="warning"` with pulsing dot
  - `approved` → `color="success"`
  - `declined` → `color="error"`
- Add a top-level "quick filter" pill row showing counts per status (e.g., "Pending (3)", "Approved (12)") that toggles the filter when tapped. This eliminates the dropdown on mobile and speeds up review workflows.
- In table rows, make the status badge slightly larger (`size="md"`) so it stands out.

### 4. Streamlined Actions
Improve the action UX:

- Replace the 3 separate icon buttons with 2 compact text+icon combo buttons: "Approve" (green) and "Decline" (red) on desktop. On mobile, keep icon-only but increase tap targets to min 44px.
- Move the Delete action into a dropdown menu or the lightbox detail view to reduce clutter in the main list.

---

### Technical Details
- **Files to modify:**
  - `src/components/admin/EmployeeBillsManagement.tsx` — full layout refactor
- **No database changes** — purely a frontend UI refactor using existing `useEmployeeBills` hook and data shape.
- **Design tokens:** Uses existing `BadgeWithDot`, `TableCard`, `Dialog`, `Button`, and `useIsMobile` from the project's Untitled UI design system.
- **Accessibility:** All photo previews maintain `aria-labels`; status colors have text labels for screen readers.

### Acceptance Criteria
1. Page looks great and is fully usable on a phone (no horizontal scrolling).
2. Receipt thumbnails are large enough to identify the document; multi-photo bills show a gallery.
3. An admin can scan the list and immediately see how many bills are pending without reading a dropdown.
4. Approve/Decline actions are fast and obvious on both mobile and desktop.
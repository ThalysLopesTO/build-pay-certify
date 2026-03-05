

# Fix: Blank Page When Selecting Address in Jobsite Form

## Problem
When clicking an address suggestion from the autocomplete dropdown in the "Add New Jobsite" form, the page goes blank. This is likely caused by an unhandled error during the place selection process, or by the input losing focus (blur) before the click event registers on the dropdown item, causing a cascade of issues.

## Root Cause Analysis

Two issues identified across three files that use the address autocomplete:

1. **Input blur race condition**: When clicking an autocomplete suggestion `<li>`, the input field's `blur` event fires before the `click` event. This can cause the predictions list to disappear or trigger unexpected re-renders before `selectPlace` executes.

2. **Unhandled errors in `selectPlace`**: The `<li>` onClick calls `selectPlace()` without try/catch. If the Google Places API or geocoding service throws an error, it goes unhandled and can crash the React tree (blank page).

## Fix

### 1. `src/hooks/useGooglePlacesAutocomplete.ts`
- Wrap the entire `selectPlace` function body in a try/catch to prevent unhandled errors from crashing React.

### 2. `src/components/admin/jobsite/JobsiteForm.tsx` (Add New form)
- Add `onMouseDown={(e) => e.preventDefault()}` to each autocomplete `<li>` element. This is the standard fix for autocomplete dropdowns -- it prevents the input from losing focus before the click registers.
- Wrap the `selectPlace` call in a try/catch.

### 3. `src/components/admin/jobsite/EditJobsiteDialog.tsx` (Edit dialog)
- Same `onMouseDown` and try/catch fix on the autocomplete `<li>` elements.

### 4. `src/components/admin/jobsite/JobsiteEditModal.tsx` (Edit modal)
- Same `onMouseDown` and try/catch fix on the autocomplete `<li>` elements.

## Scope
- 4 files modified
- No new dependencies
- No database changes



# Fix Quote Editor Mobile Layout — Buttons Overflowing

## Problem
The mobile bottom action bar (`QuoteEditorMobileActions`) uses `fixed bottom-0` positioning but the form content doesn't account for the bar's height, causing overlap. The buttons also lack proper safe-area padding on notched devices.

## Changes

### 1. `QuoteEditorMobileActions.tsx` — Fix bottom bar styling
- Replace `safe-bottom` class with proper `pb-[env(safe-area-inset-bottom)]` padding
- Ensure the bar has a solid background and adequate shadow to separate from content

### 2. `QuoteEditor.tsx` — Add bottom padding for mobile
- Add `pb-48` (or similar) to the form container when `isMobile` is true, so content scrolls above the fixed bottom bar and nothing is hidden behind it

Two files, minimal changes.

# Fix Logo in Manual Timesheet PDF

## Problem
In `src/utils/manualTimesheetPDF.ts`, the logo is force-fit into a 70×70 box with `doc.addImage(dataUrl, 'PNG', margin, y, 70, 70)`. This:
- Stretches/squishes non-square logos (the Ground Zero logo looks distorted/cropped).
- Hard-codes the format as `PNG` even when the source might be JPEG/SVG.
- Leaves the company name vertically misaligned with the logo.

## Fix

### 1. Preserve aspect ratio
Read the natural width/height of the logo image once it's loaded as a data URL, then scale it to fit inside a fixed bounding box (max 80pt tall, max 160pt wide) while keeping the original ratio.

```ts
const getImageSize = (dataUrl: string) =>
  new Promise<{ w: number; h: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = dataUrl;
  });

const MAX_W = 160;
const MAX_H = 70;
const { w, h } = await getImageSize(dataUrl);
const ratio = Math.min(MAX_W / w, MAX_H / h);
const drawW = w * ratio;
const drawH = h * ratio;
```

### 2. Detect image format
Replace the hard-coded `'PNG'` with format inferred from the data URL (`JPEG`, `PNG`, `WEBP`).

### 3. Re-align header
- Logo: drawn at `(margin, y)` with computed size, vertically centered in a 70pt header band.
- Company name + "TIME SHEET" label: shift `x` to `margin + drawW + 15` so text always sits to the right of the actual logo width (not a fixed 85pt offset).
- Keep right-aligned `Generated` / `Created` meta untouched.

### 4. Graceful fallback
If the image fails to load or has 0 dimensions, skip drawing the logo and start the company name at `margin` (no empty gap).

## Files Changed
- `src/utils/manualTimesheetPDF.ts` — only the header section (lines ~30–72).

## Out of Scope
- No DB changes.
- No changes to the rest of the PDF (tables, totals, footer remain identical).
- The other timesheet PDF generators (`useTimesheetPDF`, etc.) are not affected.

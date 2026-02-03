

# Fix: Blank Screen After Camera Upload on Mobile (iOS PWA)

## Problem Summary
When users take a photo of a bill using the "Scan Receipt" feature on mobile (especially iOS PWA), the app shows a blank white screen after returning from the camera. This is a known issue with iOS PWA camera handling combined with Radix Dialog focus trap behavior.

---

## Root Cause Analysis

The issue is caused by multiple factors working together:

1. **Radix Dialog Focus Trap**: The Dialog component from Radix UI maintains a focus trap that can interfere with iOS's camera app flow. When the user returns from the camera, focus restoration can fail.

2. **iOS PWA Viewport Issues**: iOS PWA has known quirks where returning from the camera can leave the viewport in a corrupted state (scroll position, zoom, or visibility issues).

3. **File Input Inside Modal**: The `capture="environment"` attribute triggers the native camera, but when combined with the modal's focus management, iOS can fail to properly restore the UI.

4. **Missing Error Boundaries**: If any part of the upload/extraction process fails silently, the component could be stuck in a loading state with no visible content.

---

## Solution Approach

We'll implement a multi-pronged fix:

### 1. Add Focus Management Props to Dialog
Prevent the focus trap from interfering with camera flow by adding `onOpenAutoFocus` and `onInteractOutside` handlers.

### 2. Add iOS PWA Viewport Recovery
Implement a viewport recovery mechanism that triggers after returning from the camera to restore proper scroll and visibility.

### 3. Add Error Handling and Loading States
Ensure there's always visible content even during errors or edge cases.

### 4. Add Mobile-Specific File Input Handling
Create a more robust file input handling flow for mobile devices.

---

## Technical Implementation

### File 1: `src/components/admin/income-expenses/ScanReceiptModal.tsx`

**Changes:**

1. **Add viewport recovery after file selection:**
```typescript
// Add iOS PWA viewport recovery
const recoverViewport = useCallback(() => {
  // Force a repaint/reflow to fix iOS viewport issues
  window.scrollTo(0, 0);
  document.body.style.overflow = 'auto';
  setTimeout(() => {
    document.body.style.overflow = '';
    // Force repaint
    document.body.offsetHeight;
  }, 100);
}, []);
```

2. **Update file input handler with recovery:**
```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  // iOS PWA viewport recovery
  recoverViewport();
  
  const file = e.target.files?.[0];
  if (file) {
    handleFileUpload(file);
  }
  
  // Reset input to allow re-selecting same file
  e.target.value = '';
};
```

3. **Add focus management to Dialog:**
```typescript
<DialogContent 
  className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
  onOpenAutoFocus={(e) => {
    // Prevent auto focus on mobile to avoid keyboard issues
    if (isMobile) {
      e.preventDefault();
    }
  }}
  onInteractOutside={(e) => {
    // Prevent closing when interacting with camera/file picker
    if (isUploading || isExtracting) {
      e.preventDefault();
    }
  }}
>
```

4. **Add error state with visible fallback:**
```typescript
// Add error state
const [uploadError, setUploadError] = useState<string | null>(null);

// In handleFileUpload error catch:
setUploadError('Failed to upload. Please try again.');
setIsUploading(false);
setIsExtracting(false);
```

5. **Add visible error UI in upload tab:**
```typescript
{uploadError && (
  <div className="text-center py-4">
    <p className="text-destructive mb-3">{uploadError}</p>
    <Button 
      variant="outline" 
      onClick={() => {
        setUploadError(null);
        document.getElementById('receipt-upload')?.click();
      }}
    >
      Try Again
    </Button>
  </div>
)}
```

### File 2: `src/components/ui/dialog.tsx`

**Changes:**

Update DialogContent to accept and pass through focus management props:

```typescript
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  onOpenAutoFocus?: (event: Event) => void;
  onInteractOutside?: (event: Event) => void;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, onOpenAutoFocus, onInteractOutside, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      onOpenAutoFocus={onOpenAutoFocus}
      onInteractOutside={onInteractOutside}
      className={cn(
        // ... existing classes
      )}
      {...props}
    >
      {children}
      {/* Close button */}
    </DialogPrimitive.Content>
  </DialogPortal>
))
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `ScanReceiptModal.tsx` | Add iOS viewport recovery function |
| `ScanReceiptModal.tsx` | Update file input handler with recovery |
| `ScanReceiptModal.tsx` | Add error state and visible error UI |
| `ScanReceiptModal.tsx` | Add `useIsMobile` hook import |
| `ScanReceiptModal.tsx` | Add focus management props to DialogContent |
| `dialog.tsx` | Pass through `onOpenAutoFocus` and `onInteractOutside` props |

---

## Expected Result After Fix

1. **No more blank screen**: Viewport recovery ensures the UI is visible after returning from camera
2. **Visible error states**: If upload fails, users see a clear error message with retry option
3. **Stable focus management**: Dialog won't interfere with iOS camera flow
4. **Better mobile experience**: Input reset allows re-selecting files without issues

---

## Additional Notes

- The `capture="environment"` attribute is kept for the back camera preference
- The solution is non-invasive and doesn't change the core upload/extraction logic
- Error recovery is user-friendly with clear retry options


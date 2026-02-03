

# Fix: Blank Screen After Camera Upload on Mobile (iOS PWA)

## Problem Summary
When users take a photo using the "Scan Receipt" feature on mobile (especially iOS PWA), the screen goes completely blank after returning from the camera. This happens even though the upload starts successfully (as seen in your first screenshot showing "Upload Complete - Analyzing receipt...").

## Root Cause Analysis

The issue has three contributing factors:

1. **Radix Dialog Focus Trap** - The Dialog component has `modal={true}` by default, which activates focus trapping. When iOS returns from the camera, the focus trap tries to restore focus but fails, leaving the UI in a corrupted state.

2. **iOS Viewport State Corruption** - iOS PWA has a known bug where returning from the native camera app can leave the viewport in a corrupted state (the page content becomes invisible but the app hasn't crashed).

3. **Insufficient Recovery** - The current `recoverViewport` function exists but isn't aggressive enough and doesn't include visibility forcing.

---

## Solution

### 1. Disable Modal Behavior on Mobile
Set `modal={false}` on the Dialog when on mobile to disable the focus trap that causes the issue.

### 2. Enhanced Viewport Recovery
Create a more aggressive recovery mechanism that:
- Uses multiple recovery attempts with increasing delays
- Forces visibility of the dialog content
- Uses `requestAnimationFrame` for proper rendering
- Includes Safari-specific fixes

### 3. Add Visibility State Tracking
Track whether the component is visible and force re-render if needed.

---

## Technical Details

### File 1: `src/components/admin/income-expenses/ScanReceiptModal.tsx`

**Changes:**

1. **Add mobile-specific Dialog modal prop:**
```typescript
<Dialog 
  open={isOpen} 
  onOpenChange={(open) => !open && handleClose()}
  modal={!isMobile} // Disable modal behavior on mobile to prevent focus trap issues
>
```

2. **Enhanced viewport recovery function:**
```typescript
const recoverViewport = useCallback(() => {
  // Immediate scroll reset
  window.scrollTo(0, 0);
  
  // Reset body styles
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';
  
  // Force visibility of dialog content using multiple strategies
  requestAnimationFrame(() => {
    // Force repaint
    void document.body.offsetHeight;
    
    // Safari-specific: toggle visibility
    const dialogContent = document.querySelector('[data-radix-dialog-content]');
    if (dialogContent instanceof HTMLElement) {
      dialogContent.style.opacity = '0.99';
      requestAnimationFrame(() => {
        dialogContent.style.opacity = '1';
      });
    }
  });
  
  // Additional recovery after a short delay
  setTimeout(() => {
    window.scrollTo(0, 0);
    void document.body.offsetHeight;
  }, 100);
  
  setTimeout(() => {
    void document.body.offsetHeight;
  }, 300);
}, []);
```

3. **Call recovery in multiple places:**
- After file selection (existing)
- When component re-renders while uploading/extracting
- When tab changes to 'review'

4. **Add useEffect for visibility recovery:**
```typescript
// iOS PWA recovery - force visibility when returning from camera
useEffect(() => {
  if (isOpen && (isUploading || isExtracting) && isMobile) {
    // Recovery when in loading state
    const recoveryInterval = setInterval(() => {
      recoverViewport();
    }, 500);
    
    // Clean up after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(recoveryInterval);
    }, 5000);
    
    return () => {
      clearInterval(recoveryInterval);
      clearTimeout(timeout);
    };
  }
}, [isOpen, isUploading, isExtracting, isMobile, recoverViewport]);
```

5. **Add visibility check on tab change:**
```typescript
useEffect(() => {
  if (activeTab === 'review' && isMobile) {
    recoverViewport();
  }
}, [activeTab, isMobile, recoverViewport]);
```

### File 2: `src/components/ui/dialog.tsx` (Minor update)

**Change:** Update DialogContent to support the modal prop passthrough - though this is already handled by `{...props}`, we'll make the Dialog component accept and pass modal prop explicitly for clarity.

---

## Summary of Changes

| File | Change |
|------|--------|
| `ScanReceiptModal.tsx` | Set `modal={!isMobile}` on Dialog to disable focus trap on mobile |
| `ScanReceiptModal.tsx` | Enhanced `recoverViewport` with multiple recovery strategies |
| `ScanReceiptModal.tsx` | Add useEffect for periodic recovery during upload/extraction |
| `ScanReceiptModal.tsx` | Add visibility recovery when switching to review tab |

---

## Why This Should Work

1. **`modal={false}` on mobile** - Prevents the focus trap from activating at all, which is the primary cause of the blank screen

2. **Periodic recovery attempts** - Even if iOS corrupts the viewport, the periodic recovery will keep trying to restore visibility

3. **Multiple recovery strategies** - Using `requestAnimationFrame`, opacity toggling, and forced repaints covers different iOS quirks

4. **Safari-specific opacity trick** - Toggling opacity forces Safari to repaint the element

---

## Expected Result After Fix

1. Modal opens normally on mobile
2. User takes a photo with the camera
3. App returns from camera and continues to show the loading spinner
4. Upload and analysis complete successfully
5. Review screen appears with extracted data


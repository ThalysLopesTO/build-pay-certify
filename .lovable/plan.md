

# Fix: Blank Screen After Camera on Mobile (iOS PWA) - Comprehensive Solution

## Problem Summary

When users take a photo using the "Scan Receipt" feature on mobile (especially iOS PWA in standalone mode), the screen goes completely blank after returning from the camera. The previous fixes implemented viewport recovery and focus trap disabling, but the issue persists because the root cause is deeper in how iOS handles the PWA lifecycle.

---

## Root Cause Analysis

After extensive research, this is a **well-documented iOS Safari/PWA bug** that has multiple contributing factors:

1. **iOS PWA Lifecycle Issue**: When a PWA in `display: standalone` mode launches the native camera app, iOS suspends the PWA. Upon return, iOS sometimes fails to properly restore the WebView state, leaving the viewport blank or frozen.

2. **Dialog Portal Rendering**: The Radix Dialog uses React portals which can become "detached" from the DOM when iOS corrupts the rendering context.

3. **Focus Trap Conflict**: Even with `modal={false}`, the dialog's internal state and aria-hidden attributes can interfere with iOS's rendering recovery.

4. **Insufficient Recovery Timing**: The current recovery attempts happen too quickly after file selection - before iOS has fully corrupted the viewport. We need recovery that triggers on `visibilitychange` events when the PWA becomes visible again.

---

## Solution Strategy

We'll implement a multi-layered fix targeting each root cause:

### 1. Add Visibility Change Detection
Listen for `visibilitychange` events to detect when iOS returns from the camera, then trigger aggressive recovery.

### 2. Force Component Re-render
Use a state-based key to force React to completely re-render the dialog content when visibility is restored.

### 3. Separate File Input from Dialog
Move the file input outside the Dialog portal to prevent iOS from corrupting the file picker interaction.

### 4. Add Fallback UI with Recovery Button
If all else fails, show a recovery button that forces a component reset.

---

## Technical Implementation

### File: `src/components/admin/income-expenses/ScanReceiptModal.tsx`

**Change 1: Add visibility change listener with force re-render**

```typescript
// Add a render key to force re-render on visibility recovery
const [renderKey, setRenderKey] = useState(0);
const [isRecovering, setIsRecovering] = useState(false);

// Detect when iOS returns from camera using visibilitychange
useEffect(() => {
  if (!isMobile || !isOpen) return;
  
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('[PWA] Visibility restored, triggering recovery');
      
      // Multiple recovery strategies
      recoverViewport();
      
      // Force a complete re-render after a short delay
      setTimeout(() => {
        setRenderKey(prev => prev + 1);
        recoverViewport();
      }, 100);
      
      setTimeout(() => {
        recoverViewport();
      }, 300);
      
      setTimeout(() => {
        recoverViewport();
      }, 500);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [isMobile, isOpen, recoverViewport]);
```

**Change 2: Enhanced viewport recovery with more aggressive DOM manipulation**

```typescript
const recoverViewport = useCallback(() => {
  // Immediate scroll reset
  window.scrollTo(0, 0);
  
  // Reset all body styles that iOS may have corrupted
  document.body.style.cssText = '';
  document.documentElement.style.cssText = '';
  
  // Force the document to be visible
  document.body.style.visibility = 'visible';
  document.body.style.opacity = '1';
  
  // Remove any iOS-added scroll locks
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';
  document.body.style.top = '';
  document.body.style.left = '';
  
  // Force layout recalculation
  requestAnimationFrame(() => {
    void document.body.offsetHeight;
    void document.documentElement.scrollHeight;
    
    // Find and force visibility of dialog elements
    const dialogOverlay = document.querySelector('[data-radix-dialog-overlay]');
    const dialogContent = document.querySelector('[data-radix-dialog-content]');
    
    if (dialogOverlay instanceof HTMLElement) {
      dialogOverlay.style.visibility = 'visible';
      dialogOverlay.style.opacity = '1';
    }
    
    if (dialogContent instanceof HTMLElement) {
      dialogContent.style.visibility = 'visible';
      dialogContent.style.opacity = '0.99';
      
      requestAnimationFrame(() => {
        dialogContent.style.opacity = '1';
      });
    }
  });
}, []);
```

**Change 3: Move file input outside the dialog and use refs**

```typescript
// File input ref - input will be OUTSIDE the dialog portal
const fileInputRef = useRef<HTMLInputElement>(null);

// In the component JSX, BEFORE the Dialog:
<>
  {/* File input OUTSIDE dialog to avoid portal corruption on iOS */}
  <input
    ref={fileInputRef}
    id="receipt-upload"
    type="file"
    accept="image/*"
    capture="environment"
    onChange={handleFileSelect}
    className="hidden"
    disabled={isUploading || isExtracting}
  />
  
  <Dialog ...>
    {/* Dialog content uses onClick to trigger the external input */}
  </Dialog>
</>
```

**Change 4: Update file select handler with pre-emptive recovery**

```typescript
const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  // Immediately trigger recovery when file selection completes
  console.log('[PWA] File selected, triggering recovery');
  
  // Force immediate recovery
  recoverViewport();
  
  // Set recovering state to force re-render
  setIsRecovering(true);
  setTimeout(() => setIsRecovering(false), 100);
  
  const file = e.target.files?.[0];
  if (file) {
    handleFileUpload(file);
  }
  
  // Reset input to allow re-selecting same file
  e.target.value = '';
}, [handleFileUpload, recoverViewport]);
```

**Change 5: Add recovery button as fallback**

```typescript
// In the upload tab, add a fallback recovery option:
{isMobile && (
  <div className="text-center mt-4 pt-4 border-t border-border">
    <p className="text-xs text-muted-foreground mb-2">
      Screen not responding after camera?
    </p>
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => {
        recoverViewport();
        setRenderKey(prev => prev + 1);
        toast({ title: 'Screen recovered', description: 'Please try again' });
      }}
    >
      Tap to recover
    </Button>
  </div>
)}
```

**Change 6: Apply render key to force re-render**

```typescript
<DialogContent 
  key={`dialog-content-${renderKey}`}
  className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
  // ... rest of props
>
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `ScanReceiptModal.tsx` | Add `visibilitychange` event listener for iOS recovery |
| `ScanReceiptModal.tsx` | Add `renderKey` state to force complete re-renders |
| `ScanReceiptModal.tsx` | Move file input outside Dialog portal |
| `ScanReceiptModal.tsx` | Enhanced `recoverViewport` with more aggressive DOM fixes |
| `ScanReceiptModal.tsx` | Add fallback "Tap to recover" button for mobile users |
| `ScanReceiptModal.tsx` | Update file selection handler with immediate recovery |

---

## Why This Should Work

1. **`visibilitychange` event**: This is the correct event to detect when iOS returns from the camera - it fires when the PWA becomes visible again, which is the exact moment recovery is needed.

2. **External file input**: Moving the input outside the dialog portal prevents iOS from corrupting the file picker when the dialog re-renders.

3. **Force re-render via key**: Changing the key forces React to completely unmount and remount the dialog content, clearing any corrupted state.

4. **Multiple recovery attempts**: Different iOS versions and devices may recover at different timings, so we attempt recovery at multiple intervals.

5. **Fallback button**: Even if automated recovery fails, users have a visible way to manually recover.

---

## Expected Result After Fix

1. User opens "Scan Receipt" modal on mobile
2. User selects transaction type and taps to take a photo
3. iOS camera app opens
4. User takes photo and iOS returns to the PWA
5. `visibilitychange` fires and triggers recovery
6. Dialog content re-renders with the uploaded image
7. Processing continues normally to the review step
8. If anything fails, user can tap "Tap to recover" button


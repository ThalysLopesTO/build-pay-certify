

# Fix: Dialog Disappearing on Successful Receipt Extraction (Mobile)

## Problem Summary

The user has identified a critical pattern: the blank screen **only happens when the receipt extraction is successful**. When extraction fails with an error, the dialog stays visible. This is the key insight we needed!

---

## Root Cause Analysis

Tracing through the code, I found the difference between success and error paths:

**On Success (causes blank screen):**
```typescript
// Lines 425-448: extractReceiptData success
setExtractionResult(data);           // State change 1
setTransactionTypeConfidence(...);    // State change 2
setFormData({...});                   // State change 3
setActiveTab('review');               // State change 4 - TAB SWITCH!
toast({ title: 'Analysis Complete' });
```

**On Error (dialog stays visible):**
```typescript
// Lines 455-462: extractReceiptData error
setUploadError(...);  // State change (stays on 'upload' tab)
toast({ title: 'Analysis Failed' });
// NO tab switch - dialog stays visible
```

The problem is the **rapid succession of state changes combined with the tab switch** after iOS returns from the camera. When `setActiveTab('review')` is called, React unmounts the upload content and mounts the review content. On iOS PWA, this happens while the WebView is still recovering from the camera app, causing the rendering corruption.

The existing `useEffect` recovery at lines 631-635 fires when `activeTab === 'review'`, but by then the viewport is already corrupted and the recovery isn't aggressive enough.

---

## Solution

We need to:

1. **Delay the tab switch** - Give iOS time to stabilize the viewport before switching tabs
2. **Force recovery BEFORE the tab switch** - Ensure the dialog is visible before changing content
3. **Add an intermediate "processing complete" state** - Show success message on upload tab before auto-switching to review

---

## Technical Implementation

### File: `src/components/admin/income-expenses/ScanReceiptModal.tsx`

**Change 1: Add extraction complete state for intermediate UI**

```typescript
// Add new state after line 90
const [extractionComplete, setExtractionComplete] = useState(false);
```

**Change 2: Modify the extraction success handler**

Instead of immediately switching tabs, we'll:
1. Set the extraction result and form data
2. Set an "extraction complete" flag
3. Trigger recovery
4. Delay the tab switch

```typescript
// Replace lines 425-453 in extractReceiptData
setExtractionResult(data);

if (data.transaction_type_confidence) {
  setTransactionTypeConfidence(data.transaction_type_confidence);
}

// Pre-fill form with extracted data
setFormData({
  expense_title: data.expense_title || 'Receipt',
  vendor_payee: data.vendor_payee || '',
  expense_date: data.expense_date ? parseLocalDate(data.expense_date) : new Date(),
  amount: data.amount?.toString() || '',
  category_id: data.category_id || '',
  notes: data.line_items?.length > 0 
    ? `Line Items:\n${data.line_items.map(...).join('\n')}`
    : '',
  payment_status: 'paid',
  payment_method: ''
});

// For mobile: delay tab switch to let iOS viewport stabilize
if (isMobile) {
  console.log('[PWA] Extraction complete, delaying tab switch for recovery');
  setExtractionComplete(true);
  
  // Force immediate recovery
  recoverViewport();
  
  // Force re-render to ensure dialog is visible
  setRenderKey(prev => prev + 1);
  
  // Wait for viewport to stabilize, then switch tabs
  setTimeout(() => {
    recoverViewport();
    setTimeout(() => {
      setActiveTab('review');
      setExtractionComplete(false);
      recoverViewport();
    }, 200);
  }, 300);
} else {
  // Desktop: switch immediately
  setActiveTab('review');
}

toast({
  title: 'Analysis Complete',
  description: 'Receipt data extracted. Please review and save.'
});
```

**Change 3: Show intermediate UI on upload tab when extraction is complete (mobile)**

Add this to the upload tab content, showing a "success" state before switching to review:

```typescript
// In TabsContent for "upload", add after the error state block (around line 860)
{extractionComplete && isMobile && (
  <div className="text-center py-6 border border-green-200 rounded-lg bg-green-50">
    <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
    <p className="text-green-700 font-medium mb-2">Receipt Analyzed Successfully!</p>
    <p className="text-sm text-muted-foreground">Loading review form...</p>
    <Loader2 className="h-5 w-5 animate-spin mx-auto mt-3 text-green-500" />
  </div>
)}
```

**Change 4: Reset extractionComplete in resetState**

```typescript
// Add to resetState function (around line 226)
setExtractionComplete(false);
```

**Change 5: Enhance the review tab recovery effect**

```typescript
// Replace lines 631-635
useEffect(() => {
  if (activeTab === 'review' && isMobile) {
    // Multiple recovery attempts when review tab becomes active
    recoverViewport();
    
    const recoveryAttempts = [100, 300, 500, 1000];
    const timeouts = recoveryAttempts.map(delay => 
      setTimeout(() => {
        recoverViewport();
        setRenderKey(prev => prev + 1);
      }, delay)
    );
    
    return () => timeouts.forEach(clearTimeout);
  }
}, [activeTab, isMobile, recoverViewport]);
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| State declarations | Add `extractionComplete` state |
| `resetState` function | Reset `extractionComplete` |
| `extractReceiptData` success | Delay tab switch on mobile, add recovery before switch |
| Upload tab UI | Show intermediate success state on mobile |
| Review tab effect | More aggressive recovery when review tab activates |

---

## Why This Should Work

1. **Delayed tab switch**: Gives iOS 500ms total to stabilize the viewport before the heavy DOM change of switching tabs

2. **Intermediate UI**: The user sees a success state immediately (preventing confusion), while iOS recovers in the background

3. **Pre-switch recovery**: We force visibility recovery BEFORE the tab switch happens, so the dialog is guaranteed to be visible

4. **Post-switch recovery**: Multiple attempts after tab switch catch any remaining corruption

5. **Matches error behavior**: Now success path has similar timing to error path (stays on upload tab briefly), which we know works

---

## Expected Result After Fix

1. User takes photo with camera on mobile
2. iOS returns to the app
3. Upload progress shows, then "Receipt Analyzed Successfully!" message appears
4. After ~500ms, dialog smoothly transitions to review tab
5. User can review and save the extracted data
6. No blank screen at any point


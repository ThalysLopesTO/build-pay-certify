

## Fix: Client Edit Causing System Freeze

### Problem Identified
When a user edits a client in the Clients section, the system "freezes" and requires a manual page reload. The screenshot shows the "Client updated successfully" toast appearing, confirming the update works, but the UI becomes unresponsive afterward.

### Root Cause Analysis

The freeze is caused by a **race condition between the Dialog closing and React Query's cache invalidation**, combined with conditional rendering patterns:

**Issue 1: Conditional Rendering + Query Invalidation Race Condition**
In `ClientsTable.tsx` (lines 147-153):
```typescript
{editingClient && (
  <ClientFormModal
    isOpen={!!editingClient}
    onClose={() => setEditingClient(null)}
    client={editingClient}
  />
)}
```

Here's what happens:
1. User submits the form
2. `updateClient.mutateAsync()` succeeds
3. `onSuccess` in `useUpdateClient` triggers `queryClient.invalidateQueries(['clients'])`
4. This causes the parent `ClientsTable` component to re-render with new data
5. The `client` object passed to `ClientFormModal` may now reference a **stale or different object** from the new array
6. `onClose()` is called, but the Dialog's internal state or overlay may not properly close because the component is being unmounted mid-animation

**Issue 2: Dialog Overlay Persistence**
The Radix Dialog component uses a portal with a fixed overlay (`bg-black/80`). If the Dialog component is unmounted (due to `editingClient` becoming null) while the overlay is still animating out, the overlay can get "stuck" in the DOM, blocking all interactions.

### Solution

Change the conditional rendering pattern to keep the Dialog mounted but control visibility through the `isOpen` prop, ensuring proper cleanup:

---

### Changes Required

#### File 1: `src/components/admin/clients/ClientsTable.tsx`

**Lines 37-39** - Add a separate boolean state for modal visibility:
```typescript
const [editingClient, setEditingClient] = useState<Client | null>(null);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
```

**Line 123** - Update the edit click handler:
```typescript
<DropdownMenuItem onClick={() => {
  setEditingClient(client);
  setIsEditModalOpen(true);
}}>
```

**Lines 147-153** - Change conditional rendering to always mount the modal:
```typescript
<ClientFormModal
  isOpen={isEditModalOpen}
  onClose={() => {
    setIsEditModalOpen(false);
    // Delay clearing the client to allow animation to complete
    setTimeout(() => setEditingClient(null), 200);
  }}
  client={editingClient || undefined}
/>
```

---

#### File 2: `src/components/admin/clients/ClientMobileCard.tsx`

The mobile card component already uses the better pattern (separate boolean state):
```typescript
const [isEditOpen, setIsEditOpen] = useState(false);
```

But it still conditionally renders the modal. Update **lines 124-129**:
```typescript
<ClientFormModal
  isOpen={isEditOpen}
  onClose={() => setIsEditOpen(false)}
  client={client}
/>
```

This pattern is already correct. No changes needed here.

---

#### File 3: `src/components/admin/clients/ClientFormModal.tsx`

Add a safeguard to prevent form operations if the dialog is closing. Update **lines 73-77**:
```typescript
const handleOpenChange = (open: boolean) => {
  if (!open && !isSubmitting) {
    onClose();
  }
};
```

Also, add a key prop pattern to force form reset when client changes. The `useEffect` already handles this, but we should ensure the form state is stable.

---

### Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `ClientsTable.tsx` | Separate boolean state for modal open/close | Decouple visibility from client object reference |
| `ClientsTable.tsx` | Remove conditional rendering of modal | Ensure Dialog unmounts gracefully with animations |
| `ClientsTable.tsx` | Delay clearing editingClient | Allow Dialog close animation to complete |

### Expected Result

| Before | After |
|--------|-------|
| Edit client → Success toast → UI freezes | Edit client → Success toast → Modal closes smoothly |
| Overlay stays visible blocking interactions | Overlay animates out properly |
| User must reload page | User can continue using the app |

### Technical Notes

This pattern follows React best practices for Dialog components:
1. **Always mount modals, control with `isOpen`** - Allows proper animation lifecycle
2. **Separate visibility state from data state** - Prevents race conditions with query invalidation
3. **Delay cleanup of data** - Ensures component has the data it needs during close animation


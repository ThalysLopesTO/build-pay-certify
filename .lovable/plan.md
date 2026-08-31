# Stabilize invoice create, edit, and PDF workflows

## Goal
Prevent the invoice area from becoming unresponsive after creating, editing, saving, emailing, or downloading an invoice, while keeping the user on a usable invoice screen.

## Confirmed risk areas
- Invoice PDF generation runs `html2canvas`, image conversion, attachment downloads, and PDF merging on the browser’s main thread.
- The temporary hidden PDF-rendering element is removed only on success, so an error can leave heavy DOM/canvas resources behind.
- The edit dialog clears its invoice state immediately when it closes, rather than after the dialog exit lifecycle; this conflicts with the project’s established delayed dialog-cleanup pattern for mobile browsers.
- Create mode resets the form immediately after starting the mutation instead of waiting for a successful save.
- Edit mode keeps the dialog open through attachment upload and optional PDF/email generation, making a completed database save appear stuck while slower follow-up work continues.

## Implementation
1. **Make invoice dialogs close safely**
   - Separate each invoice dialog’s open state from its selected invoice data.
   - Close first, then clear the selected invoice after the established 200 ms delay so Radix can remove its overlay and restore page interaction.
   - Apply the same safe cleanup to edit, details, and email dialogs in the invoice tracker.

2. **Make save transitions deterministic**
   - Convert create/edit submission orchestration to an awaited flow with one guarded processing state.
   - Reset the create form only after the invoice is successfully stored.
   - After create or edit succeeds, return the user to the Invoice Tracker and refresh the saved invoice list.
   - Prevent duplicate clicks while saving, uploading attachments, or resending.

3. **Separate saving from slow follow-up work**
   - Treat the database save as the primary completion point.
   - Close the editor and restore navigation after save rather than holding the modal open for attachment/PDF/email work.
   - Continue attachment upload and resend with clear progress/success/error feedback; if email delivery fails, keep the saved invoice and tell the user it can be resent.

4. **Harden PDF generation and cleanup**
   - Wrap temporary DOM, object URLs, canvases, and download elements in `try/finally` cleanup.
   - Yield before expensive rendering so loading feedback can paint, and expose a per-invoice PDF-processing state to block duplicate downloads.
   - Release large canvas/image references after use and preserve the current behavior of appending invoice attachments after the invoice pages.

5. **Verify the full workflow**
   - Test create draft, create/send, edit/save, edit/resend, and PDF download.
   - Confirm the app remains clickable after dialogs close and after both successful and failed PDF/email operations.
   - Validate desktop and mobile-sized browser behavior and check build/runtime console signals.

## Technical scope
Frontend invoice components, invoice mutation orchestration, dialog lifecycle handling, and invoice PDF utilities only. No invoice schema or business-rule changes are planned.

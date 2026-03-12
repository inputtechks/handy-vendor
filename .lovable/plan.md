
Goal: make iPhone barcode scanning much less “position-sensitive” and more reliable across Inventory, POS, and Movements.

What I found in current code:
1) `BarcodeScanner` opens a new camera session even when a stream is already open from `useCameraStream` (double camera usage can hurt iPhone reliability/focus).
2) Scanner is forced to `aspectRatio: 1.777` with a relatively tight scan box, which is less forgiving on portrait iPhone camera usage.
3) Retry flow clears error but does not reliably force a true scanner restart cycle.
4) Cleanup stops scanning but does not fully clear scanner DOM/session state.

Implementation plan

1) Refactor camera warm-up hook for iPhone stability
- Update `useCameraStream` to request permission from user tap, extract preferred camera info, then immediately release the temporary stream.
- Expose `cameraId` (or preferred camera constraint) instead of keeping a long-lived stream open.

2) Rework scanner start strategy to be more forgiving on iPhone
- In `BarcodeScanner`, start camera in this priority:
  - explicit `cameraId` (from warm-up),
  - fallback `{ facingMode: { exact: "environment" } }`,
  - fallback `{ facingMode: "environment" }`.
- Remove fixed `aspectRatio: 1.777`.
- Use a larger responsive scan area (wider + taller) so users don’t need perfect positioning.
- Keep conservative FPS (10–15) for smoother iPhone performance.
- Ensure complete teardown with `stop()` + `clear()` to avoid stale sessions.

3) Improve scan quality behavior
- Enable barcode-optimized scanner config (where supported) to improve decode speed/accuracy for book barcodes.
- Add a proper internal restart trigger (`retryKey`/nonce) so “Try Again” always reinitializes scanner from scratch.

4) Update all scanner entry pages
- Apply new hook/prop API in:
  - `src/pages/InventoryPage.tsx`
  - `src/pages/POSPage.tsx`
  - `src/pages/MovementsPage.tsx`
- Keep manual ISBN/search fallback visible for edge devices.

5) UX tweaks for iPhone usability
- Increase scanner container height and add a clearer centered guide area so users naturally align barcodes correctly.
- Show concise helper text while scanning (distance/orientation hint).

Technical details
- Files to update:
  - `src/hooks/useCameraStream.ts`
  - `src/components/BarcodeScanner.tsx`
  - `src/pages/InventoryPage.tsx`
  - `src/pages/POSPage.tsx`
  - `src/pages/MovementsPage.tsx`
- No backend/database changes required.
- This is a front-end scanner pipeline reliability fix only.

Validation checklist (after implementation)
1) Test on iPhone Safari in Inventory/POS/Movements: scanner opens on first tap.
2) Verify barcode reads from normal hand distance without precise centering.
3) Verify cancel/reopen/retry works repeatedly without camera lockups.
4) Confirm Android behavior remains unchanged or improved.

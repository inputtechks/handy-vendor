

## Problem

The barcode scanner uses `useEffect` to call `scanner.start()` which internally calls `navigator.mediaDevices.getUserMedia`. On iOS Safari, camera access **must** be initiated directly from a user gesture (click/tap). When it's called inside `useEffect`, the gesture context is lost, causing iOS to block camera access silently.

Additional issues:
- `qrbox: { width: 320, height: 180 }` may be larger than the viewport on smaller phones, causing rendering failures
- `fps: 30` is aggressive and can cause performance issues on older devices
- The cleanup doesn't handle the race condition where the component unmounts before `start()` resolves
- No retry mechanism if camera fails

## Fix

Refactor `BarcodeScanner` to request camera permission **directly in the click handler** before mounting the scanner, then pass the stream to `Html5Qrcode`:

1. **Move camera access to the parent click handler** — In `InventoryPage`, `MovementsPage`, and `POSPage`, when the user taps "Scan Barcode", call `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })` directly in the `onClick`. Store the resulting `MediaStream` and pass it as a prop to `BarcodeScanner`.

2. **Refactor `BarcodeScanner`** to accept an optional `MediaStream` prop and use `Html5Qrcode.start()` with a `cameraId` extracted from the stream's video track, or use the stream directly. This preserves the user gesture context on iOS.

3. **Make scan area responsive** — Use percentage-based `qrbox` (e.g., `qrbox: { width: 250, height: 150 }` or a function that calculates based on container size) and reduce FPS to 15 for better compatibility.

4. **Add proper cleanup** — Use an `AbortController`-style flag to prevent starting if unmounted, and stop all stream tracks on cleanup.

5. **Add a retry button** — When camera fails, show a "Try Again" button instead of just an error message.

### Files to modify:
- `src/components/BarcodeScanner.tsx` — Refactor to accept stream, responsive qrbox, better cleanup, retry button
- `src/pages/InventoryPage.tsx` — Request camera in click handler, pass stream
- `src/pages/MovementsPage.tsx` — Same
- `src/pages/POSPage.tsx` — Same (if it uses scanner)


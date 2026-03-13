

## Fix: Instant Barcode Capture on iPhones & Huawei

### Problem
The `html5-qrcode` library is scanning at 15 FPS with a restricted scan region (`qrbox`), and decodes ALL code formats. On iPhones especially, this means slow detection — the barcode must be held very close and steady. The autofocus grabber also fails silently on iOS Safari because `document.querySelector('video')` may not find the right element.

### Changes

**`src/components/BarcodeScanner.tsx`**

1. **Boost FPS from 15 → 30** — double the frame sampling rate for near-instant detection
2. **Restrict to barcode-only formats** — use `Html5QrcodeSupportedFormats` to decode only EAN-13, EAN-8, UPC-A, UPC-E, CODE-128, CODE-39, ITF, ISBN. Skipping QR/DataMatrix/Aztec cuts decode time dramatically
3. **Remove qrbox restriction** — set `qrbox` to use the full viewfinder (98% width, 80% height) so barcodes are detected from any distance/angle, not just close-up
4. **Fix autofocus for iOS** — grab video element from scanner's container div (`containerRef`) instead of `document.querySelector('video')` which is unreliable on Safari. Re-apply autofocus at multiple intervals (500ms, 1500ms, 3000ms) since iOS Safari sometimes resets focus mode
5. **Lower min resolution constraints** — remove `min: 1280`/`min: 720` which can cause iOS to reject the stream entirely; keep `ideal` values only
6. **Add `experimentalFeatures: { useBarCodeDetectorIfSupported: true }`** — on Chrome Android and newer Safari this uses the native `BarcodeDetector` API which is hardware-accelerated and significantly faster than the JS decoder

**`src/hooks/useCameraStream.ts`**

7. **Add frameRate constraint** — request `frameRate: { ideal: 30, min: 15 }` for smoother video feed
8. **Re-apply autofocus after a delay** — iOS Safari sometimes drops focus constraints; retry at 1s

### Technical detail
- `Html5QrcodeSupportedFormats` enum is already available from the `html5-qrcode` package
- The native `BarcodeDetector` API (enabled via `experimentalFeatures`) runs on-device ML on supported browsers, giving sub-100ms detection vs 200-500ms for the JS WASM decoder
- iOS Safari supports `focusMode: "continuous"` but requires it via `applyConstraints({ advanced: [...] })` on the track, and may reset it — hence the multi-interval re-application


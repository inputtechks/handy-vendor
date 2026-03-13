

# Fix Scanner for Huawei Phones

## Root Cause

Huawei phones (especially with HarmonyOS/EMUI browser) have two known quirks:

1. **`track.getSettings().deviceId` returns empty string or undefined** — so the warm-up hook extracts no `cameraId`, then passes an empty/null value to html5-qrcode which fails silently or errors out.

2. **`facingMode: { exact: "environment" }` is not supported** on some Huawei browser versions — the constraint is too strict and throws immediately, and the current fallback chain in `BarcodeScanner` catches this but may still fail if the second attempt also has issues.

## Changes

### 1. `src/hooks/useCameraStream.ts`
- After extracting `deviceId` from the warm-up stream, if it's empty/falsy, fall back to `navigator.mediaDevices.enumerateDevices()` and pick the last `videoinput` device (usually the rear camera).
- This ensures we always have a concrete `cameraId` to pass to the scanner, even on devices where `getSettings()` is incomplete.

### 2. `src/components/BarcodeScanner.tsx`
- Add a third fallback level: if both `facingMode` attempts fail, enumerate all video devices and start with the first available device ID.
- This covers Huawei browsers that reject `facingMode` constraints entirely.
- Wrap the entire fallback chain so any device with a camera will eventually connect.

## Files to edit
- `src/hooks/useCameraStream.ts`
- `src/components/BarcodeScanner.tsx`


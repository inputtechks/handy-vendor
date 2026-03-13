

## Remove Logo Background & Fit Nicely

**Approach:** Use the AI image editing model (Nano banana) to remove the background from the current logo PNG, then save the cleaned transparent version back as the logo asset.

**Steps:**
1. Create a small edge function or use the AI image API in a one-time script to edit the logo with the prompt "Remove the background from this logo, make it transparent, keep only the logo itself with clean edges"
2. Actually — simpler approach: I'll use the AI image editing capability inline by building a small utility page/component that calls the Lovable AI gateway to process the image, then save the result. But since we need to just replace the asset file, the most direct approach is:
   - Write an edge function that takes the current logo, sends it to the AI image model with a "remove background" instruction, and returns the cleaned image
   - Then download and replace the asset

**Simpler alternative:** Since the logo is a static asset, I can directly use the AI image generation tool during implementation to generate a background-removed version and write it to the asset file.

**Implementation:**
1. Use the AI image editing model (`google/gemini-2.5-flash-image`) with the current logo and prompt to remove background
2. Save the resulting transparent PNG to `src/assets/helvelitt-logo.png`
3. Adjust logo sizing across pages for clean display — ensure `object-contain` is used everywhere and sizes are appropriate

**Files to modify:**
- `src/assets/helvelitt-logo.png` — replaced with transparent version
- Optionally tweak logo `className` in `LandingPage.tsx`, `AuthPage.tsx`, `VerificationPage.tsx` if sizing needs adjustment


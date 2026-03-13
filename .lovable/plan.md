

## Fix Logo: Remove White Background & Make Larger

**Problem:** The AI-generated logo still has a white rectangle background instead of true transparency. It needs to be re-processed with a stronger prompt to ensure actual transparency, and made larger so the subtitle text is readable.

**Plan:**

1. **Re-process the logo** using the AI image editing model with a much more explicit prompt: "Remove the white background completely, make it fully transparent PNG. Keep only the book icon, the HelveLitt text, and the subtitle text. The background must be 100% transparent, not white."

2. **Increase logo sizes across all pages:**
   - **Header (LandingPage):** `h-8 sm:h-10` → `h-10 sm:h-12`
   - **Hero (LandingPage):** `h-20 sm:h-28` → `h-32 sm:h-40` — big enough to read the subtitle
   - **AuthPage:** `h-14` → `h-20`
   - **VerificationPage:** `h-14` → `h-20`

3. **Add `mix-blend-multiply`** CSS class as a fallback — this will make any remaining white background blend into the page background, ensuring it looks seamless even if AI doesn't achieve perfect transparency.

**Files to modify:**
- `src/assets/helvelitt-logo.png` — re-processed with better transparency
- `src/pages/LandingPage.tsx` — larger logo + blend mode
- `src/pages/AuthPage.tsx` — larger logo + blend mode
- `src/pages/VerificationPage.tsx` — larger logo + blend mode


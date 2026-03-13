

# Add English Language Back

## Changes

1. **`src/lib/i18n.ts`** — Update `Language` type to `"en" | "de" | "fr"`. Add `en` translations to every key in the dictionary.

2. **`src/context/LanguageContext.tsx`** — Update the stored language check to include `"en"`, keep `"fr"` as default.

3. **`src/components/LanguageToggle.tsx`** — Add an `EN` button alongside `DE` and `FR`.

French remains the default language.


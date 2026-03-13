

# Add German/French Language Toggle

## Approach

Create an i18n (internationalization) system with a React context that stores the current language (`de` or `fr`) and provides a translation function `t(key)`. Add a language toggle button in the app header area.

## What gets built

1. **Translation file** (`src/lib/i18n.ts`) — A dictionary mapping translation keys to German and French strings for all UI text across the app (nav labels, page titles, buttons, placeholders, transaction labels, etc.).

2. **Language context** (`src/context/LanguageContext.tsx`) — React context with:
   - `language` state (`"de" | "fr"`, persisted in `localStorage`)
   - `t(key)` function to look up translations
   - `setLanguage` to switch

3. **Language toggle component** (`src/components/LanguageToggle.tsx`) — A small `DE | FR` toggle button, placed in each page header or as a floating element.

4. **Update all pages and components** to use `t()` instead of hardcoded strings:
   - `BottomNav.tsx` — nav labels (Inventar/Inventaire, Verkauf/Vente, etc.)
   - `InventoryPage.tsx` — headers, buttons, placeholders, alerts
   - `POSPage.tsx` — headers, payment labels, buttons
   - `MovementsPage.tsx` — headers, movement type labels, buttons
   - `DashboardPage.tsx` — section titles, export buttons, stats labels
   - `AuthPage.tsx` — login/signup form labels
   - `BookInfoCard.tsx` — any labels
   - `BarcodeScanner.tsx` — helper text, retry button
   - `types/book.ts` — make `TRANSACTION_LABELS` language-aware (move to i18n or make dynamic)

## Technical details

- No external i18n library needed — simple key-value dictionary approach is sufficient for 2 languages
- Language preference stored in `localStorage` under key `bookbooth-lang`
- Default language: French (`fr`)
- The `LanguageContext` wraps the app in `App.tsx` alongside existing providers
- Transaction labels become functions of language rather than static constants

## Files to create
- `src/lib/i18n.ts`
- `src/context/LanguageContext.tsx`
- `src/components/LanguageToggle.tsx`

## Files to modify
- `src/App.tsx` — wrap with `LanguageProvider`
- `src/components/BottomNav.tsx`
- `src/pages/InventoryPage.tsx`
- `src/pages/POSPage.tsx`
- `src/pages/MovementsPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/AuthPage.tsx`
- `src/components/BookInfoCard.tsx`
- `src/components/BarcodeScanner.tsx`




# Transform to HelveLitt Premium Swiss SaaS

## Overview

Rebrand the app from "BookBooth" to "HelveLitt", add a public landing page with pricing, implement gated user approval via a `profiles` table, restructure routes, and overhaul the visual theme to Swiss Minimalism.

## Database Changes

**Create `profiles` table** with approval gate:
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, is_approved)
  VALUES (NEW.id, false);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

You can manually approve users by updating `is_approved = true` in the profiles table.

**Note:** Multi-tenancy with `vendor_id` and RLS is already fully implemented on both `books` and `sales` tables. No changes needed there.

## Route Restructuring

```text
/              → LandingPage (public)
/auth          → AuthPage (sign in / sign up)
/verification  → VerificationPage (logged in but not approved)
/dashboard     → InventoryPage (approved only)
/dashboard/sell      → POSPage
/dashboard/movements → MovementsPage
/dashboard/report    → DashboardPage
```

`AppRoutes` logic:
- No user → show landing page with `/auth` route available
- User but `is_approved === false` → redirect all to `/verification`
- User and approved → access `/dashboard/*` routes

## Brand & Theme Overhaul

**Color palette** applied via CSS variables in `index.css`:
- Primary: Swiss Red `#E60000` (buttons, accents)
- Text/headers: Deep Charcoal `#1A1A1A`
- Background: Off-white `#F9F9F9`
- Cards: White `#FFFFFF` with subtle borders
- Light mode only (remove dark theme variables)

**Typography:** Keep Inter (already loaded), increase heading weights.

## Landing Page (`src/pages/LandingPage.tsx`)

- **Sticky header:** HelveLitt logo + language switcher + Sign In / Sign Up buttons
- **Hero section:** Brand name, slogan, sub-headline (all translated EN/FR/DE)
- **Pricing cards** (3 tiers, strictly CHF):
  - Mensuel: 20 CHF/mois
  - Semestriel: 110 CHF/6 mois (badge "Recommandé")
  - Annuel: 200 CHF/an
  - All buttons route to `/auth`
- **Footer** with brand tagline

## Verification Page (`src/pages/VerificationPage.tsx`)

Shows translated message: "Your account is being verified. Access granted once subscription confirmed. Typically < 24 hours." With sign-out button.

## Files to Create
- `src/pages/LandingPage.tsx` — public marketing page
- `src/pages/VerificationPage.tsx` — approval gate page
- Copy logo to `src/assets/helvelitt-logo.png`

## Files to Modify
- `src/index.css` — new Swiss light theme palette
- `src/App.tsx` — new route structure, fetch profile approval status
- `src/context/AuthContext.tsx` — add `isApproved` state from profiles table
- `src/lib/i18n.ts` — add landing page, verification, and pricing translations
- `src/pages/AuthPage.tsx` — rebrand title, link back to landing
- `src/components/BottomNav.tsx` — update routes to `/dashboard/*`
- `src/components/LanguageToggle.tsx` — no functional changes needed
- `src/pages/InventoryPage.tsx`, `POSPage.tsx`, `MovementsPage.tsx`, `DashboardPage.tsx` — minor branding text updates (remove emoji prefixes, use "HelveLitt" brand)
- `index.html` — update title to "HelveLitt"

## Integrity Guardrails
- All existing POS, barcode scanning, inventory, and movement logic remains untouched
- Only wrapping with new routes and theme — functional layouts preserved
- Existing `vendor_id` RLS on books/sales already provides full multi-tenant isolation


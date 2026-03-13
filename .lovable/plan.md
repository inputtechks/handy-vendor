
Goal: stop the infinite loading screen and fully remove “BookBooth” branding from the browser top/title metadata.

What I found
1) `src/context/AuthContext.tsx` still uses an `async` `onAuthStateChange` callback with `await fetchProfileAndRole(...)` and no `try/catch/finally`.  
- If that promise hangs/fails, `setLoading(false)` is never reached, so the app stays on the full-screen loader forever.  
- Session replay confirms the UI remains stuck on the loader.

2) `index.html` is malformed and still contains old branding:  
- Broken title line: `<title>... </title>BookBooth</title>`  
- `apple-mobile-web-app-title`, OG/Twitter title/description still include BookBooth.

Implementation plan
1) Harden auth boot flow (`src/context/AuthContext.tsx`)
- Refactor auth state handling so loading is always released, even on query failures.
- Remove `await` directly inside `onAuthStateChange`; use a fire-and-forget async function from inside the callback.
- Wrap profile/role fetch in `try/catch/finally`.
- Ensure this invariant: every auth path (session found, no session, fetch error) ends by setting `loading` deterministically.
- Use safe fallback values on errors (`isApproved=false`, `isAdmin=false`) instead of hanging.

2) Make role/profile fetch resilient (`src/context/AuthContext.tsx`)
- Keep fetching approval + roles, but handle missing profile/temporary backend errors gracefully.
- Add defensive error handling for both queries so one failure cannot block app rendering.

3) Fix all top-level branding metadata (`index.html`)
- Correct the malformed `<title>` tag (single valid title only).
- Replace remaining BookBooth metadata with HelveLitt:
  - `title`
  - `apple-mobile-web-app-title`
  - `og:title`, `twitter:title`
  - `description`, `og:description`, `twitter:description`
- Keep metadata structure valid to avoid parser quirks/cached wrong title behavior.

4) Optional cleanup for consistency
- Update language persistence key in `LanguageContext` from `bookbooth-lang` to `helvelitt-lang` with backward-compatible read (read old key if new key missing), so old users keep language preference and branding is fully consistent.

Technical details
- Main fix pattern for auth:
  - `getSession()` for startup bootstrap
  - `onAuthStateChange()` callback kept synchronous
  - internal `syncAccessState(session)` async helper called with `void`
  - `finally { setLoading(false) }` in all async paths
- This prevents deadlocks/race conditions and avoids permanent loader states after sign-in.

Validation checklist (end-to-end)
1) Open `/` logged out: landing appears immediately (no infinite loader).  
2) Sign in with your admin account: loader shows briefly, then redirects to `/dashboard`.  
3) Refresh on `/`: still routes correctly based on auth/approval/admin state.  
4) Check browser tab title + share metadata: all show HelveLitt, no BookBooth text.  
5) Verify published URL after a hard refresh (cache can keep old head tags temporarily).

No backend schema changes are required for this fix.

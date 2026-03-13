

## Fix: 404 After Login

**Root cause:** After login, the browser URL is still `/auth`. But in the authenticated route blocks, there's no `/auth` route — so the `path="*"` catch-all renders `NotFound`. The `Navigate` on `/` only works if the URL is exactly `/`.

**Fix in `src/App.tsx`:**
- In both the admin and approved-user route blocks, change the catch-all `path="*"` from rendering `<NotFound />` to `<Navigate to="/dashboard" replace />`. This ensures any unknown route (including `/auth` after login) redirects to the inventory page.
- Keep `NotFound` only for the unauthenticated block where it makes sense.


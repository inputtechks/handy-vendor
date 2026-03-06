

## Problem

The `sales` table has a database CHECK constraint: `CHECK ((method = ANY (ARRAY['cash'::text, 'card'::text])))`. This rejects any insert with `method = 'twint'`, causing the sale to silently fail.

## Fix

**Database migration**: Drop the existing constraint and add a new one that includes `'twint'`:

```sql
ALTER TABLE public.sales DROP CONSTRAINT sales_method_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_method_check CHECK (method = ANY (ARRAY['cash'::text, 'card'::text, 'twint'::text]));
```

No code changes needed — the frontend already handles Twint correctly.




## Problem Identified

The math is wrong because of two issues:

1. **Units Sold is wrong**: The code counts `bookSales.length` (number of sale *records*), but each sale record can represent multiple copies (e.g., selling 3 books at once = 1 record). So "8 units sold" is actually "8 transactions," not 8 books.

2. **Gross Revenue doesn't match Units × Unit Price**: Each sale record stores `price = (salePrice - discount) × qty`, so the gross sum is correct for actual revenue, but it doesn't equal `unitsSold × unitPrice` because unitsSold is wrong and discounts vary per transaction.

**Root cause**: The `sales` table has no `quantity` column. When selling multiple copies in one transaction, `qty` is baked into the `price` but lost.

---

## Plan

### Step 1: Add `quantity` column to sales table
- Add a `quantity` integer column (default 1) to the `sales` table via migration.
- Default of 1 ensures all existing records remain valid.

### Step 2: Store quantity on each sale
- Update `sellBook()` in `StoreContext.tsx` to include `quantity: qty` in the insert.
- Update `recordMovement()` to include `quantity: qty`.
- Update the Sale type in `types/book.ts` to include `quantity: number`.
- Update the sales data fetch to read the quantity field.

### Step 3: Fix aggregation math in DashboardPage
- **Units Sold**: Sum `sale.quantity` instead of counting records.
- **Unit Price**: Use `book.salePrice` (current catalog price).
- **Gross Revenue**: Keep as sum of `s.price` (actual money collected, accounts for discounts).
- **Author Royalty**: `grossRevenue × (royaltyPct / 100)` — this part is already correct.
- **Net Revenue**: `grossRevenue - authorRoyalty` — already correct.

### Step 4: Fix CSV export
- Update export to use the corrected units/totals.

---

## Technical Details

**Database migration:**
```sql
ALTER TABLE public.sales ADD COLUMN quantity integer NOT NULL DEFAULT 1;
```

**Type change** (`src/types/book.ts`):
Add `quantity: number` to the `Sale` interface.

**StoreContext changes:**
- `sellBook` insert: add `quantity: qty`
- `recordMovement` insert: add `quantity: qty`
- Sales fetch mapping: add `quantity: s.quantity ?? 1`

**DashboardPage aggregation fix:**
```typescript
const unitsSold = bookSales.reduce((sum, s) => sum + s.quantity, 0);
```


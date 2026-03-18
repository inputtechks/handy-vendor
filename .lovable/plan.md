
Issue confirmed: the report is still mathematically inconsistent because it mixes two different price sources:
- `Unit Price` currently comes from the inventory’s current sale price.
- `Gross Revenue` comes from historical transaction totals.
When price changes over time (or discounts are used), the row no longer satisfies `Gross = Units × Unit Price`, which is exactly what your screenshot shows.

Plan to fix it:

1) Unify calculation basis in the Transactions report
- Keep grouping by ISBN as now.
- Compute `Units Sold = SUM(quantity)`.
- Compute `Gross Revenue = SUM(price)` from the selected period.
- Compute `Unit Price` from the same dataset (`Gross / Units`) so every row is internally consistent.
- Keep `Author Royalty = Gross * royalty%` and `Net = Gross - Royalty`.

2) Make rounding deterministic for finance
- Do math in centime-level precision (integers) and only format to CHF at render/export time.
- Prevent floating-point drift between row totals and grand totals.

3) Align export with the exact same row model
- Reuse the same aggregated+filtered rows used by the UI (no separate formula path).
- Ensure exported values match the on-screen table exactly for search-filtered author/book subsets.

4) Prevent future quantity undercount in offline flow
- Ensure offline queued sales store `quantity` explicitly.
- Add a safe fallback (`quantity ?? 1`) when syncing legacy queued records.
This avoids future “units too low / gross too high” mismatches for offline multi-unit checkouts.

Technical details (files to update):
- `src/pages/DashboardPage.tsx`
  - Replace current `unitPrice` logic (`book.salePrice`) with period-effective calculation from grouped sales.
  - Add cent-based math helpers for row + grand totals.
- `src/lib/offlineQueue.ts`
  - Extend pending sale schema with `quantity`.
  - Keep backward compatibility for already-queued entries.
- `src/pages/POSPage.tsx`
  - Include `quantity` when queueing offline sales.
- `src/lib/i18n.ts` (optional but recommended)
  - Update label to clarify this is period-based/effective unit price if needed.

Acceptance checks after implementation:
- For each row: `Units × Unit Price` matches displayed Gross (within displayed precision policy).
- Grand totals equal sum of visible rows.
- Exported CSV totals match table totals with active search + period filters.
- Offline sale with qty > 1 syncs with correct units and correct report math.

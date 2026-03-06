import type { Sale } from "@/types/book";
import { TRANSACTION_LABELS, REVENUE_TYPES } from "@/types/book";
import { format } from "date-fns";

export function exportSalesToCSV(sales: Sale[]) {
  if (sales.length === 0) return;

  const header = "Title,ISBN,Price,Discount,Payment Method,Transaction Type,Note,Date,Time";
  const rows = sales.map((s) => {
    const date = new Date(s.timestamp);
    return [
      `"${s.title.replace(/"/g, '""')}"`,
      s.isbn,
      s.price.toFixed(2),
      (s.discount ?? 0).toFixed(2),
      s.method === "none" ? "" : s.method.toUpperCase(),
      `"${TRANSACTION_LABELS[s.transactionType]}"`,
      `"${(s.note ?? "").replace(/"/g, '""')}"`,
      format(date, "yyyy-MM-dd"),
      format(date, "HH:mm:ss"),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  downloadCSV(csv, `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`);
}

export function exportRevenueByCategoryCSV(revenueSales: Sale[], dateFrom?: Date, dateTo?: Date) {
  if (revenueSales.length === 0) return;

  const byType: Record<string, { count: number; total: number }> = {};
  for (const type of REVENUE_TYPES) {
    const typeSales = revenueSales.filter((s) => s.transactionType === type);
    byType[type] = {
      count: typeSales.length,
      total: typeSales.reduce((sum, s) => sum + s.price, 0),
    };
  }

  const header = "Category,Sales Count,Total Revenue (CHF)";
  const rows = REVENUE_TYPES.map((type) =>
    [`"${TRANSACTION_LABELS[type]}"`, byType[type].count, byType[type].total.toFixed(2)].join(",")
  );

  const grandTotal = Object.values(byType).reduce((sum, v) => sum + v.total, 0);
  rows.push(`"TOTAL",${revenueSales.length},${grandTotal.toFixed(2)}`);

  const dateRange = dateFrom || dateTo
    ? `\n"Date range: ${dateFrom ? format(dateFrom, "dd/MM/yyyy") : "..."} – ${dateTo ? format(dateTo, "dd/MM/yyyy") : "..."}"`
    : "";

  const csv = dateRange + (dateRange ? "\n" : "") + [header, ...rows].join("\n");
  downloadCSV(csv, `revenue-by-category-${format(new Date(), "yyyy-MM-dd")}.csv`);
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

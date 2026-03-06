import type { Sale } from "@/types/book";
import { TRANSACTION_LABELS } from "@/types/book";
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
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

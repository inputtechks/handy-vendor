import { useState, useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BookOpen, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { REVENUE_TYPES, ZERO_REVENUE_TYPES } from "@/types/book";
import type { TransactionType } from "@/types/book";

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { books, sales } = useStore();
  const { t } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // --- Royalties Report ---
  const royaltiesData = useMemo(() => {
    return books
      .filter((b) => b.royaltyPercentage > 0)
      .map((book) => {
        const bookSales = sales.filter(
          (s) => s.isbn === book.isbn && REVENUE_TYPES.includes(s.transactionType)
        );
        const totalSalesRevenue = bookSales.reduce((sum, s) => sum + s.price, 0);
        const totalDue = totalSalesRevenue * (book.royaltyPercentage / 100);
        return {
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          totalSales: totalSalesRevenue,
          royaltyPct: book.royaltyPercentage,
          totalDue,
          salesCount: bookSales.length,
        };
      })
      .sort((a, b) => b.totalDue - a.totalDue);
  }, [books, sales]);

  // --- Stock Categories Report ---
  const stockCategories: { type: TransactionType; label: string }[] = [
    { type: "pilon", label: t("tx.pilon") },
    { type: "sp", label: t("tx.sp") },
    { type: "depot_deposit", label: t("tx.depot_deposit") },
    { type: "depot_return", label: t("tx.depot_return") },
    { type: "depot_sold", label: t("tx.depot_sold") },
  ];

  const stockMovementsData = useMemo(() => {
    const filtered = categoryFilter === "all"
      ? sales
      : sales.filter((s) => s.transactionType === categoryFilter);

    // Group by ISBN
    const grouped: Record<string, { title: string; author: string; isbn: string; movements: Record<string, number> }> = {};

    for (const s of filtered) {
      if (!grouped[s.isbn]) {
        const book = books.find((b) => b.isbn === s.isbn);
        grouped[s.isbn] = {
          title: s.title,
          author: book?.author ?? "",
          isbn: s.isbn,
          movements: {},
        };
      }
      grouped[s.isbn].movements[s.transactionType] = (grouped[s.isbn].movements[s.transactionType] ?? 0) + 1;
    }

    return Object.values(grouped);
  }, [sales, books, categoryFilter]);

  const categorySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    for (const cat of stockCategories) {
      summary[cat.type] = sales.filter((s) => s.transactionType === cat.type).length;
    }
    return summary;
  }, [sales]);

  // --- Export functions ---
  const exportRoyalties = () => {
    if (royaltiesData.length === 0) return;
    const header = "Title,Author,Total Sales (CHF),Royalty %,Total Due (CHF)";
    const rows = royaltiesData.map((r) =>
      [`"${r.title.replace(/"/g, '""')}"`, `"${r.author.replace(/"/g, '""')}"`, r.totalSales.toFixed(2), r.royaltyPct.toFixed(1), r.totalDue.toFixed(2)].join(",")
    );
    const grandTotal = royaltiesData.reduce((sum, r) => sum + r.totalDue, 0);
    rows.push(`"TOTAL","",${royaltiesData.reduce((s, r) => s + r.totalSales, 0).toFixed(2)},"",${grandTotal.toFixed(2)}`);
    downloadCSV([header, ...rows].join("\n"), `royalties-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  const exportStockMovements = () => {
    if (stockMovementsData.length === 0) return;
    const types = stockCategories.map((c) => c.type);
    const header = ["Title", "Author", "ISBN", ...stockCategories.map((c) => c.label)].join(",");
    const rows = stockMovementsData.map((item) =>
      [`"${item.title.replace(/"/g, '""')}"`, `"${item.author.replace(/"/g, '""')}"`, item.isbn, ...types.map((t) => item.movements[t] ?? 0)].join(",")
    );
    downloadCSV([header, ...rows].join("\n"), `stock-movements-${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t("reports.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("reports.subtitle")}</p>
        </div>
        <LanguageToggle />
      </header>

      <Tabs defaultValue="royalties" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="royalties" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {t("reports.royalties")}
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            {t("reports.stockCategories")}
          </TabsTrigger>
        </TabsList>

        {/* Royalties Tab */}
        <TabsContent value="royalties" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {royaltiesData.length} {t("reports.booksWithRoyalties")}
            </p>
            {royaltiesData.length > 0 && (
              <Button variant="outline" size="sm" className="gap-2" onClick={exportRoyalties}>
                <Download className="h-4 w-4" />
                {t("reports.exportCSV")}
              </Button>
            )}
          </div>

          {royaltiesData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("reports.noRoyalties")}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">{t("inv.bookTitle")}</TableHead>
                    <TableHead className="font-bold">{t("inv.author")}</TableHead>
                    <TableHead className="font-bold text-right">{t("reports.totalSales")}</TableHead>
                    <TableHead className="font-bold text-right">{t("reports.royaltyPct")}</TableHead>
                    <TableHead className="font-bold text-right">{t("reports.totalDue")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {royaltiesData.map((r) => (
                    <TableRow key={r.isbn}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell className="text-muted-foreground">{r.author}</TableCell>
                      <TableCell className="text-right">CHF {r.totalSales.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{r.royaltyPct}%</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">CHF {r.totalDue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell colSpan={2}>{t("reports.grandTotal")}</TableCell>
                    <TableCell className="text-right">
                      CHF {royaltiesData.reduce((s, r) => s + r.totalSales, 0).toFixed(2)}
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right">
                      CHF {royaltiesData.reduce((s, r) => s + r.totalDue, 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Stock Categories Tab */}
        <TabsContent value="stock" className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stockCategories.map((cat) => (
              <div
                key={cat.type}
                className="rounded-xl bg-secondary border border-border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setCategoryFilter(categoryFilter === cat.type ? "all" : cat.type)}
              >
                <p className="text-xs font-medium text-muted-foreground">{cat.label}</p>
                <p className="text-2xl font-black">{categorySummary[cat.type] ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("dash.movements")}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 h-9">
                  <SelectValue placeholder={t("reports.filterBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("reports.allCategories")}</SelectItem>
                  {stockCategories.map((cat) => (
                    <SelectItem key={cat.type} value={cat.type}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoryFilter !== "all" && (
                <Button variant="ghost" size="sm" onClick={() => setCategoryFilter("all")} className="text-xs">
                  {t("reports.clearFilter")}
                </Button>
              )}
            </div>
            {stockMovementsData.length > 0 && (
              <Button variant="outline" size="sm" className="gap-2" onClick={exportStockMovements}>
                <Download className="h-4 w-4" />
                {t("reports.exportCSV")}
              </Button>
            )}
          </div>

          {stockMovementsData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("reports.noMovements")}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">{t("inv.bookTitle")}</TableHead>
                    <TableHead className="font-bold">{t("inv.author")}</TableHead>
                    {stockCategories.map((cat) => (
                      <TableHead key={cat.type} className="font-bold text-center text-xs">{cat.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovementsData.map((item) => (
                    <TableRow key={item.isbn}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.author}</TableCell>
                      {stockCategories.map((cat) => (
                        <TableCell key={cat.type} className="text-center">
                          {item.movements[cat.type] ? (
                            <Badge variant={item.movements[cat.type] > 0 ? "default" : "secondary"}>
                              {item.movements[cat.type]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

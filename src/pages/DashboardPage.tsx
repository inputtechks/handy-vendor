import { useState, useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { format, startOfDay, endOfDay } from "date-fns";
import { DollarSign, Banknote, CreditCard, Smartphone, AlertTriangle, Download, LogOut, ArrowRightLeft, CalendarIcon, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportSalesToCSV, exportRevenueByCategoryCSV } from "@/lib/exportSales";
import { REVENUE_TYPES, ZERO_REVENUE_TYPES } from "@/types/book";
import type { Sale, TransactionType } from "@/types/book";
import { cn } from "@/lib/utils";

function DateRangePicker({
  dateFrom, dateTo, onFromChange, onToChange, onClear, fromLabel, toLabel,
}: {
  dateFrom?: Date; dateTo?: Date;
  onFromChange: (d: Date | undefined) => void;
  onToChange: (d: Date | undefined) => void;
  onClear: () => void;
  fromLabel: string; toLabel: string;
}) {
  const hasFilter = dateFrom || dateTo;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs h-8", !dateFrom && "text-muted-foreground")}>
            <CalendarIcon className="h-3 w-3" />
            {dateFrom ? format(dateFrom, "dd/MM/yy") : fromLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dateFrom} onSelect={onFromChange} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs h-8", !dateTo && "text-muted-foreground")}>
            <CalendarIcon className="h-3 w-3" />
            {dateTo ? format(dateTo, "dd/MM/yy") : toLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dateTo} onSelect={onToChange} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1 text-xs text-muted-foreground h-8 px-2">
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function filterByDate(sales: Sale[], dateFrom?: Date, dateTo?: Date) {
  if (!dateFrom && !dateTo) return sales;
  return sales.filter((s) => {
    const d = new Date(s.timestamp);
    if (dateFrom && d < startOfDay(dateFrom)) return false;
    if (dateTo && d > endOfDay(dateTo)) return false;
    return true;
  });
}

export default function DashboardPage() {
  const { sales, books } = useStore();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const [revFrom, setRevFrom] = useState<Date | undefined>();
  const [revTo, setRevTo] = useState<Date | undefined>();
  const [txFrom, setTxFrom] = useState<Date | undefined>();
  const [txTo, setTxTo] = useState<Date | undefined>();

  const revFilteredSales = useMemo(() => filterByDate(sales, revFrom, revTo), [sales, revFrom, revTo]);
  const txFilteredSales = useMemo(() => filterByDate(sales, txFrom, txTo), [sales, txFrom, txTo]);

  const revenueSales = revFilteredSales.filter((s) => REVENUE_TYPES.includes(s.transactionType));
  const adjustments = revFilteredSales.filter((s) => ZERO_REVENUE_TYPES.includes(s.transactionType));

  const totalRevenue = revenueSales.reduce((sum, s) => sum + s.price, 0);
  const cashTotal = revenueSales.filter((s) => s.method === "cash").reduce((sum, s) => sum + s.price, 0);
  const cardTotal = revenueSales.filter((s) => s.method === "card").reduce((sum, s) => sum + s.price, 0);
  const twintTotal = revenueSales.filter((s) => s.method === "twint").reduce((sum, s) => sum + s.price, 0);
  const lowStock = books.filter((b) => b.quantity <= 1);

  const revenueByType = REVENUE_TYPES.reduce((acc, type) => {
    acc[type] = revenueSales.filter((s) => s.transactionType === type).reduce((sum, s) => sum + s.price, 0);
    return acc;
  }, {} as Record<string, number>);

  const adjustmentCounts = ZERO_REVENUE_TYPES.reduce((acc, type) => {
    acc[type] = adjustments.filter((s) => s.transactionType === type).length;
    return acc;
  }, {} as Record<string, number>);

  const methodBadge = (method: string) => {
    if (method === "cash") return "bg-cash/20 text-cash";
    if (method === "twint") return "bg-twint/20 text-twint";
    if (method === "none") return "bg-muted text-muted-foreground";
    return "bg-card-pay/20 text-card-pay";
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t("dash.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("dash.overview")}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button variant="secondary" size="sm" className="gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            {t("dash.signOut")}
          </Button>
        </div>
      </header>

      {/* Revenue */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{t("dash.revenue")}</h2>
          <DateRangePicker dateFrom={revFrom} dateTo={revTo} onFromChange={setRevFrom} onToChange={setRevTo}
            onClear={() => { setRevFrom(undefined); setRevTo(undefined); }} fromLabel={t("dash.from")} toLabel={t("dash.to")} />
        </div>

        <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 flex items-center gap-4 mb-3">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("dash.totalRevenue")}</p>
            <p className="text-3xl font-black">CHF {totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{revenueSales.length} {t("dash.sales")}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-cash/10 border border-cash/20 p-4">
            <Banknote className="h-6 w-6 text-cash mb-2" />
            <p className="text-xs font-medium text-muted-foreground">{t("dash.cash")}</p>
            <p className="text-xl font-black">CHF {cashTotal.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-card-pay/10 border border-card-pay/20 p-4">
            <CreditCard className="h-6 w-6 text-card-pay mb-2" />
            <p className="text-xs font-medium text-muted-foreground">{t("dash.card")}</p>
            <p className="text-xl font-black">CHF {cardTotal.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-twint/10 border border-twint/20 p-4">
            <Smartphone className="h-6 w-6 text-twint mb-2" />
            <p className="text-xs font-medium text-muted-foreground">{t("dash.twint")}</p>
            <p className="text-xl font-black">CHF {twintTotal.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-muted-foreground">{t("dash.byCategory")}</p>
          {revenueSales.length > 0 && (
            <Button variant="secondary" size="sm" className="gap-2 text-xs h-7" onClick={() => exportRevenueByCategoryCSV(revenueSales, revFrom, revTo)}>
              <Download className="h-3 w-3" /> {t("dash.export")}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {REVENUE_TYPES.map((type) => (
            <div key={type} className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">{t(`tx.${type}`)}</p>
              <p className="text-lg font-black">CHF {(revenueByType[type] ?? 0).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stock adjustments */}
      {adjustments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" /> {t("dash.stockAdjustments")}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {ZERO_REVENUE_TYPES.map((type) => (
              <div key={type} className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">{t(`tx.${type}`)}</p>
                <p className="text-lg font-black">{adjustmentCounts[type] ?? 0} {t("dash.movements")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" /> {t("dash.lowStock")}
          </h2>
          <div className="space-y-2">
            {lowStock.map((b) => (
              <div key={b.isbn} className="flex items-center justify-between rounded-lg bg-warning/10 border border-warning/20 p-3">
                <div className="min-w-0">
                  <p className="font-bold truncate">{b.title}</p>
                  <p className="text-sm text-muted-foreground">{b.author}</p>
                </div>
                <span className={`text-sm font-black px-3 py-1 rounded-full ${b.quantity === 0 ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}`}>
                  {b.quantity} {t("dash.left")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">{t("dash.transactions")} ({txFilteredSales.length})</h2>
          {txFilteredSales.length > 0 && (
            <Button variant="secondary" size="sm" className="gap-2 text-xs h-7" onClick={() => exportSalesToCSV(txFilteredSales)}>
              <Download className="h-3 w-3" /> {t("dash.csv")}
            </Button>
          )}
        </div>
        <div className="mb-3">
          <DateRangePicker dateFrom={txFrom} dateTo={txTo} onFromChange={setTxFrom} onToChange={setTxTo}
            onClear={() => { setTxFrom(undefined); setTxTo(undefined); }} fromLabel={t("dash.from")} toLabel={t("dash.to")} />
        </div>
        {txFilteredSales.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {(txFrom || txTo) ? t("dash.noTransactionsForDates") : t("dash.noTransactionsYet")}
          </p>
        ) : (
          <div className="space-y-2">
            {txFilteredSales.slice(0, 50).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate text-sm">{s.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{t(`tx.${s.transactionType}`)}</span>
                    {s.note && <span className="text-xs text-muted-foreground">· {s.note}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{format(new Date(s.timestamp), "dd/MM/yy h:mm a")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${methodBadge(s.method)}`}>
                    {s.method === "none" ? "—" : s.method.toUpperCase()}
                  </span>
                  <span className="font-bold">{s.price > 0 ? `CHF ${s.price.toFixed(2)}` : "CHF 0"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Detailed Reports Section --- */}
      <RoyaltiesAndStockReports books={books} sales={sales} t={t} />
    </div>
  );
}

/* ─── Royalties & Stock Reports (inline) ─── */

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function RoyaltiesAndStockReports({ books, sales, t }: { books: any[]; sales: Sale[]; t: (k: string) => string }) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const stockCategories: { type: TransactionType; label: string }[] = [
    { type: "pilon", label: t("tx.pilon") },
    { type: "sp", label: t("tx.sp") },
    { type: "depot_deposit", label: t("tx.depot_deposit") },
    { type: "depot_return", label: t("tx.depot_return") },
    { type: "depot_sold", label: t("tx.depot_sold") },
  ];

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
        };
      })
      .sort((a, b) => b.totalDue - a.totalDue);
  }, [books, sales]);

  const stockMovementsData = useMemo(() => {
    const filtered = categoryFilter === "all" ? sales : sales.filter((s) => s.transactionType === categoryFilter);
    const grouped: Record<string, { title: string; author: string; isbn: string; movements: Record<string, number> }> = {};
    for (const s of filtered) {
      if (!grouped[s.isbn]) {
        const book = books.find((b) => b.isbn === s.isbn);
        grouped[s.isbn] = { title: s.title, author: book?.author ?? "", isbn: s.isbn, movements: {} };
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
    <div>
      <h2 className="text-lg font-bold mb-3">{t("reports.title")}</h2>
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

import { useState, useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { DollarSign, Banknote, CreditCard, Smartphone, AlertTriangle, Download, LogOut, ArrowRightLeft, CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { exportSalesToCSV, exportRevenueByCategoryCSV } from "@/lib/exportSales";
import { TRANSACTION_LABELS, REVENUE_TYPES, ZERO_REVENUE_TYPES } from "@/types/book";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { sales, books } = useStore();
  const { signOut } = useAuth();
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    if (!dateFrom && !dateTo) return sales;
    return sales.filter((s) => {
      const d = new Date(s.timestamp);
      if (dateFrom && d < startOfDay(dateFrom)) return false;
      if (dateTo && d > endOfDay(dateTo)) return false;
      return true;
    });
  }, [sales, dateFrom, dateTo]);

  const revenueSales = filteredSales.filter((s) => REVENUE_TYPES.includes(s.transactionType));
  const adjustments = filteredSales.filter((s) => ZERO_REVENUE_TYPES.includes(s.transactionType));

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

  const hasDateFilter = dateFrom || dateTo;
  const clearDates = () => { setDateFrom(undefined); setDateTo(undefined); };

  const dateLabel = () => {
    if (dateFrom && dateTo) return `${format(dateFrom, "dd/MM/yy")} – ${format(dateTo, "dd/MM/yy")}`;
    if (dateFrom) return `From ${format(dateFrom, "dd/MM/yy")}`;
    if (dateTo) return `Until ${format(dateTo, "dd/MM/yy")}`;
    return "All time";
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">📊 Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview</p>
        </div>
        <Button variant="secondary" size="sm" className="gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </header>

      {/* Date filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("gap-2 text-xs", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, "dd/MM/yy") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("gap-2 text-xs", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateTo ? format(dateTo, "dd/MM/yy") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        {hasDateFilter && (
          <Button variant="ghost" size="sm" onClick={clearDates} className="gap-1 text-xs text-muted-foreground">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{dateLabel()}</span>
      </div>

      {/* Total Revenue */}
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 flex items-center gap-4 mb-3">
        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
          <DollarSign className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
          <p className="text-3xl font-black">CHF {totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{revenueSales.length} sales</p>
        </div>
      </div>

      {/* Payment method breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-cash/10 border border-cash/20 p-4">
          <Banknote className="h-6 w-6 text-cash mb-2" />
          <p className="text-xs font-medium text-muted-foreground">Cash</p>
          <p className="text-xl font-black">CHF {cashTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-card-pay/10 border border-card-pay/20 p-4">
          <CreditCard className="h-6 w-6 text-card-pay mb-2" />
          <p className="text-xs font-medium text-muted-foreground">Card</p>
          <p className="text-xl font-black">CHF {cardTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-twint/10 border border-twint/20 p-4">
          <Smartphone className="h-6 w-6 text-twint mb-2" />
          <p className="text-xs font-medium text-muted-foreground">Twint</p>
          <p className="text-xl font-black">CHF {twintTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Revenue by category + export */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Revenue by Category</h2>
          {revenueSales.length > 0 && (
            <Button variant="secondary" size="sm" className="gap-2 text-xs" onClick={() => exportRevenueByCategoryCSV(revenueSales, dateFrom, dateTo)}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {REVENUE_TYPES.map((type) => (
            <div key={type} className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">{TRANSACTION_LABELS[type]}</p>
              <p className="text-lg font-black">CHF {(revenueByType[type] ?? 0).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stock adjustments */}
      {adjustments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" /> Stock Adjustments
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {ZERO_REVENUE_TYPES.map((type) => (
              <div key={type} className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">{TRANSACTION_LABELS[type]}</p>
                <p className="text-lg font-black">{adjustmentCounts[type] ?? 0} movements</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" /> Low Stock Alerts
          </h2>
          <div className="space-y-2">
            {lowStock.map((b) => (
              <div key={b.isbn} className="flex items-center justify-between rounded-lg bg-warning/10 border border-warning/20 p-3">
                <div className="min-w-0">
                  <p className="font-bold truncate">{b.title}</p>
                  <p className="text-sm text-muted-foreground">{b.author}</p>
                </div>
                <span className={`text-sm font-black px-3 py-1 rounded-full ${b.quantity === 0 ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}`}>
                  {b.quantity} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Transactions ({filteredSales.length})</h2>
          {filteredSales.length > 0 && (
            <Button variant="secondary" size="sm" className="gap-2 text-xs" onClick={() => exportSalesToCSV(filteredSales)}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          )}
        </div>
        {filteredSales.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No transactions {hasDateFilter ? "for selected dates" : "yet"}</p>
        ) : (
          <div className="space-y-2">
            {filteredSales.slice(0, 50).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate text-sm">{s.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{TRANSACTION_LABELS[s.transactionType]}</span>
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
    </div>
  );
}

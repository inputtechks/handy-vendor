import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { DollarSign, Banknote, CreditCard, AlertTriangle, Download, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportSalesToCSV } from "@/lib/exportSales";

export default function DashboardPage() {
  const { sales, books } = useStore();
  const { signOut } = useAuth();

  const totalRevenue = sales.reduce((sum, s) => sum + s.price, 0);
  const cashTotal = sales.filter((s) => s.method === "cash").reduce((sum, s) => sum + s.price, 0);
  const cardTotal = sales.filter((s) => s.method === "card").reduce((sum, s) => sum + s.price, 0);
  const lowStock = books.filter((b) => b.quantity <= 1);

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">📊 Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Today's summary</p>
        </div>
        <Button variant="secondary" size="sm" className="gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-black">CHF {totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-cash/10 border border-cash/20 p-4">
            <Banknote className="h-6 w-6 text-cash mb-2" />
            <p className="text-xs font-medium text-muted-foreground">Cash</p>
            <p className="text-2xl font-black">CHF {cashTotal.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{sales.filter((s) => s.method === "cash").length} sales</p>
          </div>
          <div className="rounded-xl bg-card-pay/10 border border-card-pay/20 p-4">
            <CreditCard className="h-6 w-6 text-card-pay mb-2" />
            <p className="text-xs font-medium text-muted-foreground">Card</p>
            <p className="text-2xl font-black">CHF {cardTotal.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{sales.filter((s) => s.method === "card").length} sales</p>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Low Stock Alerts
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

      {/* Sales History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Recent Sales ({sales.length})</h2>
          {sales.length > 0 && (
            <Button variant="secondary" size="sm" className="gap-2" onClick={() => exportSalesToCSV(sales)}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
        {sales.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No sales yet</p>
        ) : (
          <div className="space-y-2">
            {sales.slice(0, 50).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(s.timestamp), "h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.method === "cash" ? "bg-cash/20 text-cash" : "bg-card-pay/20 text-card-pay"}`}>
                    {s.method.toUpperCase()}
                  </span>
                  <span className="font-bold">CHF {s.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

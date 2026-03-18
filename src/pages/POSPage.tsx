import { useState, useCallback, useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { BookInfoCard } from "@/components/BookInfoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ScanBarcode, Search, Banknote, CreditCard, Check, XCircle,
  Minus, Plus, Smartphone, Trash2, ShoppingCart, Percent, CloudOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Book } from "@/types/book";
import { useCameraStream } from "@/hooks/useCameraStream";
import { queueOfflineSale, getPendingSales, syncOfflineSales } from "@/lib/offlineQueue";

interface CartItem {
  book: Book;
  qty: number;
  discountPct: number; // 0–100
}

type Stage = "idle" | "scanning" | "checkout" | "cash-change" | "done" | "error";

export default function POSPage() {
  const { getBook, sellBook, searchBooks } = useStore();
  const { user } = useAuth();
  const { cameraId, requestCamera, reset: resetCamera } = useCameraStream();
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();

  const [stage, setStage] = useState<Stage>("idle");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastMethod, setLastMethod] = useState<"cash" | "card" | "twint" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [amountReceived, setAmountReceived] = useState("");
  const [changeAmount, setChangeAmount] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Check pending offline sales count on mount & after sync
  useState(() => {
    getPendingSales().then((s) => setPendingCount(s.length)).catch(() => {});
  });

  const itemTotal = (item: CartItem) => {
    const discounted = item.book.salePrice * (1 - item.discountPct / 100);
    return Math.max(0, discounted * item.qty);
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + itemTotal(item), 0),
    [cart]
  );

  // --- Cart operations ---
  const addToCart = useCallback((book: Book) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.book.isbn === book.isbn);
      if (existing) {
        if (existing.qty >= book.quantity) {
          toast.error(t("pos.maxStock"));
          return prev;
        }
        return prev.map((i) =>
          i.book.isbn === book.isbn ? { ...i, qty: i.qty + 1 } : i
        );
      }
      if (book.quantity <= 0) {
        toast.error(`"${book.title}" ${t("pos.outOfStock")}`);
        return prev;
      }
      return [...prev, { book, qty: 1, discountPct: 0 }];
    });
  }, [t]);

  const updateCartQty = useCallback((isbn: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.book.isbn !== isbn) return i;
          const newQty = i.qty + delta;
          if (newQty > i.book.quantity) {
            toast.error(t("pos.maxStock"));
            return i;
          }
          return { ...i, qty: Math.max(0, newQty) };
        })
        .filter((i) => i.qty > 0)
    );
  }, [t]);

  const removeFromCart = useCallback((isbn: string) => {
    setCart((prev) => prev.filter((i) => i.book.isbn !== isbn));
  }, []);

  const updateDiscount = useCallback((isbn: string, pct: number) => {
    const clamped = Math.min(100, Math.max(0, pct));
    setCart((prev) =>
      prev.map((i) => (i.book.isbn === isbn ? { ...i, discountPct: clamped } : i))
    );
  }, []);

  // --- Scan handler: add to cart & keep scanning ---
  const handleScan = useCallback(
    (code: string) => {
      const book = getBook(code);
      if (book) {
        addToCart(book);
        toast.success(`${book.title} ${t("pos.addedToCart")}`);
        // Scanner will re-mount because key changes via retryKey internally,
        // but we stay in scanning stage for continuous scanning
      } else {
        toast.error(t("pos.notFound"));
      }
      // Re-activate scanner for next scan
      setStage("idle");
      setTimeout(() => handleStartScan(), 300);
    },
    [getBook, addToCart, t]
  );

  const handleSearchSelect = (book: Book) => {
    setSearchQuery("");
    setSearchResults([]);
    addToCart(book);
    toast.success(`${book.title} ${t("pos.addedToCart")}`);
  };

  const handleStartScan = async () => {
    const ok = await requestCamera();
    if (ok) setStage("scanning");
  };

  // --- Checkout ---
  const handleCheckout = (method: "cash" | "card" | "twint") => {
    if (cart.length === 0) return;
    if (method === "cash") {
      setLastMethod("cash");
      setAmountReceived("");
      setChangeAmount(null);
      setStage("cash-change");
      return;
    }
    finalizeSale(method);
  };

  const handleCashConfirm = () => {
    const received = parseFloat(amountReceived);
    if (isNaN(received) || received < subtotal) return;
    setChangeAmount(received - subtotal);
    finalizeSale("cash");
  };

  const finalizeSale = async (method: "cash" | "card" | "twint") => {
    setProcessing(true);
    let allOk = true;
    for (const item of cart) {
      const discountPerUnit = item.book.salePrice * (item.discountPct / 100);
      const sale = await sellBook(item.book.isbn, method, item.qty, discountPerUnit, "retail");
      if (!sale) {
        allOk = false;
        toast.error(`Failed: ${item.book.title}`);
      }
    }
    setProcessing(false);
    if (allOk) {
      setLastMethod(method);
      setStage("done");
      setTimeout(() => fullReset(), 3000);
    }
  };

  const fullReset = () => {
    setStage("idle");
    resetCamera();
    setCart([]);
    setErrorMsg("");
    setAmountReceived("");
    setChangeAmount(null);
    setLastMethod(null);
  };

  const stopScanning = () => {
    setStage("idle");
    resetCamera();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-48">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">{t("pos.title")}</h1>
          {cart.length > 0 && (
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <ShoppingCart className="h-5 w-5" />
              <span>{cart.reduce((s, i) => s + i.qty, 0)}</span>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t("pos.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchResults(e.target.value.trim() ? searchBooks(e.target.value) : []);
            }}
            className="pl-10 h-12 text-base bg-secondary border-border"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card p-1">
            {searchResults.map((b) => (
              <button
                key={b.isbn}
                onClick={() => handleSearchSelect(b)}
                className="w-full text-left rounded-md hover:bg-secondary p-1 transition-colors"
              >
                <BookInfoCard book={b} compact />
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Scanner / Scan button */}
        <AnimatePresence mode="wait">
          {stage === "scanning" ? (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <BarcodeScanner onScan={handleScan} active cameraId={cameraId} />
              <Button variant="secondary" onClick={stopScanning} className="w-full h-12 text-base">
                {t("pos.stopScanning")}
              </Button>
            </motion.div>
          ) : stage === "cash-change" ? (
            <motion.div key="cash-change" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="text-center">
                <p className="text-muted-foreground text-lg font-semibold">{t("pos.totalDue")}</p>
                <p className="text-5xl font-black text-primary">CHF {subtotal.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">{t("pos.amountReceived")}</label>
                <Input
                  type="number"
                  min={subtotal}
                  step="0.1"
                  placeholder={subtotal.toFixed(2)}
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="h-16 text-3xl font-black text-center bg-secondary border-border"
                  autoFocus
                />
              </div>
              {amountReceived && parseFloat(amountReceived) >= subtotal && (
                <div className="bg-cash/20 border border-cash/40 rounded-xl p-4 text-center">
                  <p className="text-muted-foreground text-sm font-semibold">{t("pos.changeToGive")}</p>
                  <p className="text-4xl font-black text-cash">CHF {(parseFloat(amountReceived) - subtotal).toFixed(2)}</p>
                </div>
              )}
              {amountReceived && parseFloat(amountReceived) < subtotal && (
                <p className="text-destructive text-center font-semibold">{t("pos.amountLess")}</p>
              )}
              <Button
                onClick={handleCashConfirm}
                disabled={!amountReceived || parseFloat(amountReceived) < subtotal || processing}
                className="h-16 w-full text-xl font-black bg-cash hover:bg-cash/90 text-cash-foreground rounded-xl"
              >
                <Check className="h-6 w-6 mr-2" />
                {t("pos.confirmCash")}
              </Button>
              <Button variant="secondary" onClick={() => setStage("idle")} className="w-full h-12">
                {t("common.back")}
              </Button>
            </motion.div>
          ) : stage === "done" ? (
            <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
              <div className={`h-24 w-24 rounded-full flex items-center justify-center ${lastMethod === "cash" ? "bg-cash" : lastMethod === "twint" ? "bg-twint" : "bg-card-pay"}`}>
                <Check className="h-12 w-12 text-primary-foreground" />
              </div>
              <p className="mt-4 text-2xl font-black">{t("pos.saleComplete")}</p>
              <p className="text-muted-foreground font-medium capitalize">{lastMethod} {t("pos.paymentRecorded")}</p>
              {changeAmount !== null && changeAmount > 0 && (
                <p className="mt-2 text-xl font-black text-cash">Change: CHF {changeAmount.toFixed(2)}</p>
              )}
            </motion.div>
          ) : stage === "error" ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4 py-16">
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-xl font-bold text-center">{errorMsg}</p>
              <Button onClick={fullReset} className="h-14 px-8 text-lg">{t("common.tryAgain")}</Button>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button onClick={handleStartScan} className="w-full h-24 text-xl font-black gap-3 rounded-xl">
                <ScanBarcode className="h-8 w-8" />
                {cart.length > 0 ? t("pos.scanNext") : t("pos.scanToSell")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart items */}
        {cart.length > 0 && stage !== "done" && stage !== "cash-change" && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t("pos.cart")} ({cart.reduce((s, i) => s + i.qty, 0)})
            </h2>
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.book.isbn}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3"
                >
                  {/* Cover thumbnail */}
                  {item.book.coverUrl ? (
                    <img
                      src={item.book.coverUrl}
                      alt={item.book.title}
                      className="h-14 w-10 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-10 bg-muted rounded-md flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                      —
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.book.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.book.author}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.discountPct > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          CHF {(item.book.salePrice * item.qty).toFixed(2)}
                        </span>
                      )}
                      <span className="text-sm font-black text-primary">
                        CHF {itemTotal(item).toFixed(2)}
                      </span>
                    </div>
                    {/* Discount input */}
                    <div className="flex items-center gap-1 mt-1">
                      <Percent className="h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={item.discountPct || ""}
                        placeholder="0"
                        onChange={(e) => updateDiscount(item.book.isbn, parseFloat(e.target.value) || 0)}
                        className="h-7 w-16 text-xs text-center bg-secondary border-border px-1"
                      />
                      <span className="text-xs text-muted-foreground">{t("pos.discount")}</span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => updateCartQty(item.book.isbn, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-black text-lg">{item.qty}</span>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => updateCartQty(item.book.isbn, 1)}
                      disabled={item.qty >= item.book.quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.book.isbn)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky checkout bar */}
      {cart.length > 0 && stage !== "done" && stage !== "cash-change" && (
        <div className="fixed bottom-16 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t-2 border-primary/20 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">{t("pos.subtotal")}</span>
            <span className="text-2xl font-black text-primary">CHF {subtotal.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => handleCheckout("cash")}
              disabled={processing}
              className="h-16 text-sm font-black gap-1 bg-cash hover:bg-cash/90 text-cash-foreground rounded-xl flex-col"
            >
              <Banknote className="h-6 w-6" />
              {t("pos.cash")}
            </Button>
            <Button
              onClick={() => handleCheckout("card")}
              disabled={processing}
              className="h-16 text-sm font-black gap-1 bg-card-pay hover:bg-card-pay/90 text-card-pay-foreground rounded-xl flex-col"
            >
              <CreditCard className="h-6 w-6" />
              {t("pos.card")}
            </Button>
            <Button
              onClick={() => handleCheckout("twint")}
              disabled={processing}
              className="h-16 text-sm font-black gap-1 bg-twint hover:bg-twint/90 text-twint-foreground rounded-xl flex-col"
            >
              <Smartphone className="h-6 w-6" />
              {t("pos.twint")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

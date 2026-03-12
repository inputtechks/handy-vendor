import { useState, useCallback } from "react";
import { useStore } from "@/context/StoreContext";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { BookInfoCard } from "@/components/BookInfoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanBarcode, Search, Banknote, CreditCard, Check, XCircle, Minus, Plus, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Book } from "@/types/book";
import { useCameraStream } from "@/hooks/useCameraStream";

type Stage = "idle" | "scanning" | "confirm" | "cash-change" | "done" | "error";

export default function POSPage() {
  const { getBook, sellBook, searchBooks } = useStore();
  const { stream, requestStream, stopStream } = useCameraStream();
  const [stage, setStage] = useState<Stage>("idle");
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [lastMethod, setLastMethod] = useState<"cash" | "card" | "twint" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [sellQty, setSellQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [discountInput, setDiscountInput] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [changeAmount, setChangeAmount] = useState<number | null>(null);

  const totalPrice = currentBook ? Math.max(0, (currentBook.salePrice - discount) * sellQty) : 0;

  const handleScan = useCallback(
    (code: string) => {
      const book = getBook(code);
      if (book && book.quantity > 0) {
        setCurrentBook(book);
        setSellQty(1);
        setDiscount(0);
        setDiscountInput("");
        setStage("confirm");
        setErrorMsg("");
      } else if (book) {
        setErrorMsg(`"${book.title}" is out of stock!`);
        setStage("error");
      } else {
        setErrorMsg("Book not found in inventory. Add it in Inventory mode first.");
        setStage("error");
      }
    },
    [getBook]
  );

  const handleSell = async (method: "cash" | "card" | "twint") => {
    if (!currentBook) return;

    if (method === "cash") {
      setLastMethod("cash");
      setAmountReceived("");
      setChangeAmount(null);
      setStage("cash-change");
      return;
    }

    const sale = await sellBook(currentBook.isbn, method, sellQty, discount, "retail");
    if (!sale) return;
    setLastMethod(method);
    setStage("done");
    setTimeout(() => reset(), 2500);
  };

  const handleCashConfirm = async () => {
    if (!currentBook) return;
    const received = parseFloat(amountReceived);
    if (isNaN(received) || received < totalPrice) return;

    setChangeAmount(received - totalPrice);
    const sale = await sellBook(currentBook.isbn, "cash", sellQty, discount, "retail");
    if (!sale) return;
    setStage("done");
    setTimeout(() => reset(), 3000);
  };

  const handleSearchSelect = (book: Book) => {
    setSearchQuery("");
    setSearchResults([]);
    if (book.quantity > 0) {
      setCurrentBook(book);
      setSellQty(1);
      setDiscount(0);
      setDiscountInput("");
      setStage("confirm");
    } else {
      setErrorMsg(`"${book.title}" is out of stock!`);
      setStage("error");
    }
  };

  const reset = () => {
    setStage("idle");
    stopStream();
    setCurrentBook(null);
    setErrorMsg("");
    setSellQty(1);
    setDiscount(0);
    setDiscountInput("");
    setAmountReceived("");
    setChangeAmount(null);
    setLastMethod(null);
  };

  const handleStartScan = async () => {
    const ok = await requestStream();
    if (ok) setStage("scanning");
  };

  const handleDiscountChange = (val: string) => {
    setDiscountInput(val);
    const num = parseFloat(val);
    setDiscount(isNaN(num) || num < 0 ? 0 : num);
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <header className="mb-4">
        <h1 className="text-3xl font-black tracking-tight">💰 Sales</h1>
      </header>

      {/* Search fallback */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search book by name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchResults(e.target.value.trim() ? searchBooks(e.target.value) : []);
          }}
          className="pl-10 h-14 text-lg bg-secondary border-border"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="mb-4 space-y-2 max-h-60 overflow-y-auto">
          {searchResults.map((b) => (
            <button key={b.isbn} onClick={() => handleSearchSelect(b)} className="w-full text-left">
              <BookInfoCard book={b} compact />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-center">
            <Button onClick={handleStartScan} className="w-full h-32 text-2xl font-black gap-4 rounded-xl">
              <ScanBarcode className="h-10 w-10" />
              SCAN TO SELL
            </Button>
          </motion.div>
        )}

        {stage === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 flex-1">
            <BarcodeScanner onScan={handleScan} active stream={stream} />
            <Button variant="secondary" onClick={reset} className="w-full h-14 text-lg">
              Cancel
            </Button>
          </motion.div>
        )}

        {stage === "confirm" && currentBook && (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-4">
            <BookInfoCard book={currentBook} />

            {/* Quantity selector */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-4">
                <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full" onClick={() => setSellQty((q) => Math.max(1, q - 1))} disabled={sellQty <= 1}>
                  <Minus className="h-5 w-5" />
                </Button>
                <span className="text-2xl font-black w-12 text-center">{sellQty}</span>
                <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full" onClick={() => setSellQty((q) => Math.min(currentBook.quantity, q + 1))} disabled={sellQty >= currentBook.quantity}>
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{currentBook.quantity} available</p>
            </div>

            {/* Discount input */}
            <div className="flex items-center gap-3 bg-secondary rounded-lg p-3">
              <label className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Discount (CHF)</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0.00"
                value={discountInput}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="h-10 text-lg bg-background border-border"
              />
            </div>

            {/* Price display */}
            <div className="text-center">
              {discount > 0 && (
                <p className="text-lg text-muted-foreground line-through">CHF {(currentBook.salePrice * sellQty).toFixed(2)}</p>
              )}
              <p className="text-4xl font-black text-primary">CHF {totalPrice.toFixed(2)}</p>
            </div>

            {/* Payment buttons */}
            <div className="grid grid-cols-3 gap-2 mt-auto">
              <Button onClick={() => handleSell("cash")} className="h-24 text-base font-black gap-2 bg-cash hover:bg-cash/90 text-cash-foreground rounded-xl flex-col">
                <Banknote className="h-7 w-7" />
                CASH
              </Button>
              <Button onClick={() => handleSell("card")} className="h-24 text-base font-black gap-2 bg-card-pay hover:bg-card-pay/90 text-card-pay-foreground rounded-xl flex-col">
                <CreditCard className="h-7 w-7" />
                CARD
              </Button>
              <Button onClick={() => handleSell("twint")} className="h-24 text-base font-black gap-2 bg-twint hover:bg-twint/90 text-twint-foreground rounded-xl flex-col">
                <Smartphone className="h-7 w-7" />
                TWINT
              </Button>
            </div>
            <Button variant="secondary" onClick={reset} className="w-full h-12">
              Cancel
            </Button>
          </motion.div>
        )}

        {stage === "cash-change" && currentBook && (
          <motion.div key="cash-change" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-5 justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-lg font-semibold">Total Due</p>
              <p className="text-5xl font-black text-primary">CHF {totalPrice.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Amount Received (CHF)</label>
              <Input
                type="number"
                min={totalPrice}
                step="0.1"
                placeholder={totalPrice.toFixed(2)}
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="h-16 text-3xl font-black text-center bg-secondary border-border"
                autoFocus
              />
            </div>

            {amountReceived && parseFloat(amountReceived) >= totalPrice && (
              <div className="bg-cash/20 border border-cash/40 rounded-xl p-4 text-center">
                <p className="text-muted-foreground text-sm font-semibold">Change to Give</p>
                <p className="text-4xl font-black text-cash">CHF {(parseFloat(amountReceived) - totalPrice).toFixed(2)}</p>
              </div>
            )}

            {amountReceived && parseFloat(amountReceived) < totalPrice && (
              <p className="text-destructive text-center font-semibold">Amount is less than total</p>
            )}

            <Button
              onClick={handleCashConfirm}
              disabled={!amountReceived || parseFloat(amountReceived) < totalPrice}
              className="h-16 text-xl font-black bg-cash hover:bg-cash/90 text-cash-foreground rounded-xl"
            >
              <Check className="h-6 w-6 mr-2" />
              CONFIRM CASH PAYMENT
            </Button>
            <Button variant="secondary" onClick={() => setStage("confirm")} className="w-full h-12">
              Back
            </Button>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
            <div className={`h-24 w-24 rounded-full flex items-center justify-center ${lastMethod === "cash" ? "bg-cash" : lastMethod === "twint" ? "bg-twint" : "bg-card-pay"}`}>
              <Check className="h-12 w-12 text-foreground" />
            </div>
            <p className="mt-4 text-2xl font-black">Sale Complete!</p>
            <p className="text-muted-foreground font-medium capitalize">{lastMethod} payment recorded</p>
            {changeAmount !== null && changeAmount > 0 && (
              <p className="mt-2 text-xl font-black text-cash">Change: CHF {changeAmount.toFixed(2)}</p>
            )}
          </motion.div>
        )}

        {stage === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-4">
            <XCircle className="h-16 w-16 text-destructive" />
            <p className="text-xl font-bold text-center">{errorMsg}</p>
            <Button onClick={reset} className="h-14 px-8 text-lg">
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

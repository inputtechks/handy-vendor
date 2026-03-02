import { useState, useCallback } from "react";
import { useStore } from "@/context/StoreContext";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { BookInfoCard } from "@/components/BookInfoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanBarcode, Search, Banknote, CreditCard, Check, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Book } from "@/types/book";

type Stage = "idle" | "scanning" | "confirm" | "done" | "error";

export default function POSPage() {
  const { getBook, sellBook, searchBooks } = useStore();
  const [stage, setStage] = useState<Stage>("idle");
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [lastMethod, setLastMethod] = useState<"cash" | "card" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);

  const handleScan = useCallback(
    (code: string) => {
      const book = getBook(code);
      if (book && book.quantity > 0) {
        setCurrentBook(book);
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

  const handleSell = (method: "cash" | "card") => {
    if (!currentBook) return;
    const sale = sellBook(currentBook.isbn, method);
    if (sale) {
      setLastMethod(method);
      setStage("done");
      setTimeout(() => {
        setStage("idle");
        setCurrentBook(null);
        setLastMethod(null);
      }, 2000);
    }
  };

  const handleSearchSelect = (book: Book) => {
    setSearchQuery("");
    setSearchResults([]);
    if (book.quantity > 0) {
      setCurrentBook(book);
      setStage("confirm");
    } else {
      setErrorMsg(`"${book.title}" is out of stock!`);
      setStage("error");
    }
  };

  const reset = () => {
    setStage("idle");
    setCurrentBook(null);
    setErrorMsg("");
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
            <button
              key={b.isbn}
              onClick={() => handleSearchSelect(b)}
              className="w-full text-left"
            >
              <BookInfoCard book={b} compact />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-center">
            <Button
              onClick={() => setStage("scanning")}
              className="w-full h-32 text-2xl font-black gap-4 rounded-xl"
            >
              <ScanBarcode className="h-10 w-10" />
              SCAN TO SELL
            </Button>
          </motion.div>
        )}

        {stage === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 flex-1">
            <BarcodeScanner onScan={handleScan} active />
            <Button variant="secondary" onClick={reset} className="w-full h-14 text-lg">
              Cancel
            </Button>
          </motion.div>
        )}

        {stage === "confirm" && currentBook && (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-4">
            <BookInfoCard book={currentBook} />
            <div className="text-center">
              <p className="text-4xl font-black text-primary">${currentBook.salePrice.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <Button
                onClick={() => handleSell("cash")}
                className="h-24 text-xl font-black gap-3 bg-cash hover:bg-cash/90 text-cash-foreground rounded-xl flex-col"
              >
                <Banknote className="h-8 w-8" />
                PAY WITH CASH
              </Button>
              <Button
                onClick={() => handleSell("card")}
                className="h-24 text-xl font-black gap-3 bg-card-pay hover:bg-card-pay/90 text-card-pay-foreground rounded-xl flex-col"
              >
                <CreditCard className="h-8 w-8" />
                PAY WITH CARD
              </Button>
            </div>
            <Button variant="secondary" onClick={reset} className="w-full h-12">
              Cancel
            </Button>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
            <div className={`h-24 w-24 rounded-full flex items-center justify-center ${lastMethod === "cash" ? "bg-cash" : "bg-card-pay"}`}>
              <Check className="h-12 w-12 text-foreground" />
            </div>
            <p className="mt-4 text-2xl font-black">Sale Complete!</p>
            <p className="text-muted-foreground font-medium capitalize">{lastMethod} payment recorded</p>
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

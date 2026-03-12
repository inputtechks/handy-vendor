import { useState, useCallback } from "react";
import { useStore } from "@/context/StoreContext";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { BookInfoCard } from "@/components/BookInfoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ScanBarcode, Check, Trash2 } from "lucide-react";
import { useCameraStream } from "@/hooks/useCameraStream";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Stage = "idle" | "scanning" | "form" | "added";

export default function InventoryPage() {
  const { addBook, removeBook, books, searchBooks } = useStore();
  const [stage, setStage] = useState<Stage>("idle");
  const [isbn, setIsbn] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof books>([]);

  const handleScan = useCallback((code: string) => {
    setIsbn(code);
    setEditTitle("");
    setEditAuthor("");
    setStage("form");
  }, []);

  const handleAdd = async () => {
    const p = parseFloat(price);
    const q = parseInt(qty);
    if (!isbn || isNaN(p) || p <= 0 || isNaN(q) || q <= 0) return;

    await addBook({
      isbn,
      title: editTitle.trim() || "Unknown Title",
      author: editAuthor.trim() || "Unknown Author",
      coverUrl: "",
      salePrice: p,
      quantity: q,
    });

    setStage("added");
    setTimeout(() => {
      setStage("idle");
      setIsbn("");
      setEditTitle("");
      setEditAuthor("");
      setPrice("");
      setQty("1");
    }, 1500);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setSearchResults(q.trim() ? searchBooks(q) : []);
  };

  const reset = () => {
    setStage("idle");
    setIsbn("");
    setEditTitle("");
    setEditAuthor("");
    setPrice("");
    setQty("1");
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">📦 Inventory</h1>
        <p className="text-muted-foreground text-sm mt-1">Scan or search to add books</p>
      </header>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by title, author, or ISBN..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-12 text-base bg-secondary border-border"
        />
      </div>

      {searchQuery && searchResults.length > 0 && (
        <div className="mb-6 space-y-2">
          {searchResults.map((b) => (
            <BookInfoCard key={b.isbn} book={b} compact />
          ))}
        </div>
      )}

      {searchQuery && searchResults.length === 0 && (
        <p className="text-muted-foreground text-center text-sm mb-6">No books found</p>
      )}

      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <Button
              onClick={() => setStage("scanning")}
              className="w-full h-16 text-lg font-bold gap-3"
            >
              <ScanBarcode className="h-6 w-6" />
              Scan Barcode
            </Button>
            <div className="flex gap-2">
              <Input
                placeholder="Enter barcode manually"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="h-12 text-base bg-secondary"
              />
              <Button onClick={() => { if (isbn.trim()) { setStage("form"); } }} variant="secondary" className="h-12 px-4">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {stage === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <BarcodeScanner onScan={handleScan} active />
            <Button variant="secondary" onClick={reset} className="w-full h-12">
              Cancel
            </Button>
          </motion.div>
        )}

        {stage === "form" && (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground">Scanned Barcode</p>
              <p className="text-lg font-black font-mono tracking-wider">{isbn}</p>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1 block">Book Title</label>
                <Input
                  placeholder="Enter book title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-12 text-base bg-secondary"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1 block">Author</label>
                <Input
                  placeholder="Enter author name"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className="h-12 text-base bg-secondary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1 block">Sale Price (CHF)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-14 text-xl font-bold bg-secondary text-center"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1 block">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="h-14 text-xl font-bold bg-secondary text-center"
                />
              </div>
            </div>
            <Button onClick={handleAdd} className="w-full h-14 text-lg font-bold gap-2" disabled={!price || parseFloat(price) <= 0}>
              <Plus className="h-5 w-5" />
              Add to Inventory
            </Button>
            <Button variant="secondary" onClick={reset} className="w-full h-12">
              Cancel
            </Button>
          </motion.div>
        )}

        {stage === "added" && (
          <motion.div
            key="added"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-12"
          >
            <div className="h-20 w-20 rounded-full bg-cash flex items-center justify-center animate-pulse-success">
              <Check className="h-10 w-10 text-cash-foreground" />
            </div>
            <p className="mt-4 text-xl font-bold">Book Added!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory List */}
      {stage === "idle" && !searchQuery && books.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">Current Stock ({books.length})</h2>
          <div className="space-y-2">
            {books.map((b) => (
              <div key={b.isbn} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <BookInfoCard book={b} compact />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-10 w-10 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove "{b.title}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove this book from your inventory.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => await removeBook(b.isbn)}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

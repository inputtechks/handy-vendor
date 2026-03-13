import { useState, useCallback } from "react";
import { useStore } from "@/context/StoreContext";
import { useLanguage } from "@/context/LanguageContext";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { BookInfoCard } from "@/components/BookInfoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanBarcode, Search, Check, XCircle, Minus, Plus, ArrowRightLeft } from "lucide-react";
import { useCameraStream } from "@/hooks/useCameraStream";
import { motion, AnimatePresence } from "framer-motion";
import type { Book, TransactionType } from "@/types/book";

type Stage = "idle" | "scanning" | "select-type" | "confirm" | "done" | "error";

const MOVEMENT_TYPE_KEYS: { type: TransactionType; labelKey: string; descKey: string; color: string }[] = [
  { type: "depot_deposit", labelKey: "movType.depot_deposit", descKey: "movType.depot_deposit.desc", color: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  { type: "depot_sold", labelKey: "movType.depot_sold", descKey: "movType.depot_sold.desc", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  { type: "depot_return", labelKey: "movType.depot_return", descKey: "movType.depot_return.desc", color: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
  { type: "auteur", labelKey: "movType.auteur", descKey: "movType.auteur.desc", color: "bg-purple-500/10 border-purple-500/30 text-purple-400" },
  { type: "internet", labelKey: "movType.internet", descKey: "movType.internet.desc", color: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" },
  { type: "pilon", labelKey: "movType.pilon", descKey: "movType.pilon.desc", color: "bg-destructive/10 border-destructive/30 text-destructive" },
  { type: "sp", labelKey: "movType.sp", descKey: "movType.sp.desc", color: "bg-orange-500/10 border-orange-500/30 text-orange-400" },
];

const ZERO_REVENUE_MOVEMENTS: TransactionType[] = ["pilon", "sp", "depot_deposit", "depot_return"];

export default function MovementsPage() {
  const { getBook, sellBook, recordMovement, searchBooks } = useStore();
  const { cameraId, requestCamera, reset: resetCamera } = useCameraStream();
  const { t } = useLanguage();
  const [stage, setStage] = useState<Stage>("idle");
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const handleScan = useCallback(
    (code: string) => {
      const book = getBook(code);
      if (book) { setCurrentBook(book); setQty(1); setNote(""); setStage("select-type"); setErrorMsg(""); }
      else { setErrorMsg(t("mov.notFoundError")); setStage("error"); }
    },
    [getBook, t]
  );

  const handleSearchSelect = (book: Book) => {
    setSearchQuery(""); setSearchResults([]);
    setCurrentBook(book); setQty(1); setNote(""); setStage("select-type");
  };

  const handleTypeSelect = (type: TransactionType) => { setSelectedType(type); setStage("confirm"); };

  const handleConfirm = async () => {
    if (!currentBook || !selectedType) return;
    if (ZERO_REVENUE_MOVEMENTS.includes(selectedType)) {
      const result = await recordMovement(currentBook.isbn, qty, selectedType, note);
      if (result) { setStage("done"); setTimeout(reset, 2500); }
      else { setErrorMsg(t("mov.failedRecord")); setStage("error"); }
    } else {
      const result = await sellBook(currentBook.isbn, "cash", qty, 0, selectedType, note);
      if (result) { setStage("done"); setTimeout(reset, 2500); }
      else { setErrorMsg(t("mov.failedGeneric")); setStage("error"); }
    }
  };

  const reset = () => {
    setStage("idle"); resetCamera(); setCurrentBook(null); setSelectedType(null);
    setErrorMsg(""); setQty(1); setNote(""); setSearchQuery(""); setSearchResults([]);
  };

  const handleStartScan = async () => { const ok = await requestCamera(); if (ok) setStage("scanning"); };

  const maxQty = currentBook ? (selectedType === "depot_return" ? 999 : currentBook.quantity) : 1;

  return (
    <div className="min-h-screen bg-background p-4 pb-24 flex flex-col">
      <header className="mb-4">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <ArrowRightLeft className="h-7 w-7" /> {t("mov.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("mov.subtitle")}</p>
      </header>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder={t("mov.searchPlaceholder")} value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSearchResults(e.target.value.trim() ? searchBooks(e.target.value) : []); }}
          className="pl-10 h-14 text-lg bg-secondary border-border"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="mb-4 space-y-2 max-h-60 overflow-y-auto">
          {searchResults.map((b) => (
            <button key={b.isbn} onClick={() => handleSearchSelect(b)} className="w-full text-left"><BookInfoCard book={b} compact /></button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-center">
            <Button onClick={handleStartScan} variant="secondary" className="w-full h-32 text-2xl font-black gap-4 rounded-xl">
              <ScanBarcode className="h-10 w-10" />
              {t("mov.scanForMovement")}
            </Button>
          </motion.div>
        )}

        {stage === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 flex-1">
            <BarcodeScanner onScan={handleScan} active cameraId={cameraId} />
            <Button variant="secondary" onClick={reset} className="w-full h-14 text-lg">{t("common.cancel")}</Button>
          </motion.div>
        )}

        {stage === "select-type" && currentBook && (
          <motion.div key="select-type" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-3">
            <BookInfoCard book={currentBook} compact />
            <p className="text-lg font-bold">{t("mov.selectType")}</p>
            <div className="space-y-2">
              {MOVEMENT_TYPE_KEYS.map((mt) => (
                <button key={mt.type} onClick={() => handleTypeSelect(mt.type)}
                  className={`w-full text-left rounded-xl border p-4 transition-colors hover:opacity-80 ${mt.color}`}>
                  <p className="font-bold">{t(mt.labelKey)}</p>
                  <p className="text-xs opacity-80">{t(mt.descKey)}</p>
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={reset} className="w-full h-12 mt-2">{t("common.cancel")}</Button>
          </motion.div>
        )}

        {stage === "confirm" && currentBook && selectedType && (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-4">
            <BookInfoCard book={currentBook} compact />
            <div className="rounded-xl bg-secondary p-4 text-center">
              <p className="text-sm text-muted-foreground">{t("mov.movementType")}</p>
              <p className="text-xl font-black">{t(`tx.${selectedType}`)}</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}><Minus className="h-5 w-5" /></Button>
              <span className="text-2xl font-black w-12 text-center">{qty}</span>
              <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}><Plus className="h-5 w-5" /></Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {selectedType === "depot_return" ? t("mov.returningToStock") : `${currentBook.quantity} ${t("mov.inStock")}`}
            </p>
            <Input placeholder={t("mov.notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} className="h-12 bg-secondary border-border" />
            {ZERO_REVENUE_MOVEMENTS.includes(selectedType) ? (
              <p className="text-center text-sm text-muted-foreground">{t("mov.noRevenue")}</p>
            ) : (
              <p className="text-center text-2xl font-black text-primary">CHF {(currentBook.salePrice * qty).toFixed(2)}</p>
            )}
            <Button onClick={handleConfirm} className="h-16 text-xl font-black rounded-xl mt-auto">
              <Check className="h-6 w-6 mr-2" /> {t("mov.confirm")}
            </Button>
            <Button variant="secondary" onClick={() => setStage("select-type")} className="w-full h-12">{t("common.back")}</Button>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center"><Check className="h-12 w-12 text-primary-foreground" /></div>
            <p className="mt-4 text-2xl font-black">{t("mov.recorded")}</p>
            {selectedType && <p className="text-muted-foreground">{t(`tx.${selectedType}`)}</p>}
          </motion.div>
        )}

        {stage === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-4">
            <XCircle className="h-16 w-16 text-destructive" />
            <p className="text-xl font-bold text-center">{errorMsg}</p>
            <Button onClick={reset} className="h-14 px-8 text-lg">{t("common.tryAgain")}</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { useStore } from "@/context/StoreContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, FileDown, AlertCircle, Check } from "lucide-react";
import type { Book } from "@/types/book";

interface ParsedRow {
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  price: number;
  category: string;
}

type ImportStage = "upload" | "preview" | "importing" | "done";
type DuplicateMode = "skip" | "update";

const REQUIRED_HEADERS = ["Title", "ISBN_Barcode", "Price_CHF"];
const ALL_HEADERS = ["Title", "Author", "ISBN_Barcode", "Quantity", "Price_CHF", "Category"];

export function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const data = [
    ALL_HEADERS,
    ["Le Petit Prince", "Antoine de Saint-Exupéry", "9782070612758", 5, 12.90, "Fiction"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws["!cols"] = [
    { wch: 30 }, { wch: 30 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Books");
  XLSX.writeFile(wb, "HelveLitt_Import_Template.xlsx");
}

function parseFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        if (json.length === 0) {
          reject(new Error("empty"));
          return;
        }

        const headers = Object.keys(json[0]);
        const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
        if (missing.length > 0) {
          reject(new Error("invalid_format"));
          return;
        }

        const rows: ParsedRow[] = json
          .map((row) => ({
            title: String(row["Title"] ?? "").trim(),
            author: String(row["Author"] ?? "Unknown Author").trim(),
            isbn: String(row["ISBN_Barcode"] ?? "").trim(),
            quantity: Math.max(1, parseInt(String(row["Quantity"] ?? "1")) || 1),
            price: parseFloat(String(row["Price_CHF"] ?? "0")) || 0,
            category: String(row["Category"] ?? "").trim(),
          }))
          .filter((r) => r.title && r.isbn && r.price > 0);

        if (rows.length === 0) {
          reject(new Error("no_valid_rows"));
          return;
        }

        resolve(rows);
      } catch {
        reject(new Error("parse_error"));
      }
    };
    reader.onerror = () => reject(new Error("read_error"));
    reader.readAsArrayBuffer(file);
  });
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportModal({ open, onOpenChange }: Props) {
  const { addBook, books } = useStore();
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<ImportStage>("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState("");
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  const reset = useCallback(() => {
    setStage("upload");
    setRows([]);
    setError("");
    setProgress(0);
    setImportedCount(0);
    setSkippedCount(0);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    try {
      const parsed = await parseFile(file);
      setRows(parsed);
      setStage("preview");
    } catch (err: any) {
      if (err.message === "invalid_format") {
        setError(t("bulk.invalidFormat"));
      } else if (err.message === "no_valid_rows") {
        setError(t("bulk.noValidRows"));
      } else {
        setError(t("bulk.parseError"));
      }
    }
  };

  const handleImport = async () => {
    setStage("importing");
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const existing = books.find((b) => b.isbn === row.isbn);

      if (existing) {
        if (duplicateMode === "skip") {
          skipped++;
        } else {
          // Update quantity mode — add to existing
          await addBook({
            isbn: row.isbn,
            title: row.title,
            author: row.author,
            coverUrl: "",
            salePrice: row.price,
            quantity: row.quantity,
            category: row.category,
            royaltyPercentage: 0,
          });
          imported++;
        }
      } else {
        await addBook({
          isbn: row.isbn,
          title: row.title,
          author: row.author,
          coverUrl: "",
          salePrice: row.price,
          quantity: row.quantity,
          category: row.category,
        });
        imported++;
      }

      setProgress(Math.round(((i + 1) / rows.length) * 100));

      // Yield to UI every 10 rows
      if ((i + 1) % 10 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    setImportedCount(imported);
    setSkippedCount(skipped);
    setStage("done");
  };

  const duplicates = rows.filter((r) => books.some((b) => b.isbn === r.isbn));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t("bulk.title")}
          </DialogTitle>
        </DialogHeader>

        {stage === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("bulk.instructions")}</p>

            <Button variant="outline" onClick={() => downloadTemplate()} className="w-full gap-2">
              <FileDown className="h-4 w-4" />
              {t("bulk.downloadTemplate")}
            </Button>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
              <Button onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" />
                {t("bulk.selectFile")}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">.xlsx, .xls, .csv</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {stage === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("bulk.previewCount").replace("{count}", String(rows.length))}
            </p>

            {/* Preview table */}
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-2 font-semibold">{t("inv.bookTitle")}</th>
                    <th className="text-left p-2 font-semibold">{t("inv.author")}</th>
                    <th className="text-right p-2 font-semibold">ISBN</th>
                    <th className="text-right p-2 font-semibold">{t("inv.quantity")}</th>
                    <th className="text-right p-2 font-semibold">CHF</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2 truncate max-w-[120px]">{r.title}</td>
                      <td className="p-2 truncate max-w-[100px]">{r.author}</td>
                      <td className="p-2 text-right font-mono">{r.isbn}</td>
                      <td className="p-2 text-right">{r.quantity}</td>
                      <td className="p-2 text-right">{r.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{rows.length - 5} {t("bulk.moreRows")}
                </p>
              )}
            </div>

            {/* Duplicate handling */}
            {duplicates.length > 0 && (
              <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-semibold">
                  {t("bulk.duplicatesFound").replace("{count}", String(duplicates.length))}
                </p>
                <RadioGroup value={duplicateMode} onValueChange={(v) => setDuplicateMode(v as DuplicateMode)}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="skip" id="dup-skip" />
                    <Label htmlFor="dup-skip" className="text-sm">{t("bulk.skipDuplicates")}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="update" id="dup-update" />
                    <Label htmlFor="dup-update" className="text-sm">{t("bulk.updateQuantities")}</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={reset} className="flex-1">{t("common.cancel")}</Button>
              <Button onClick={handleImport} className="flex-1 gap-2">
                <Upload className="h-4 w-4" />
                {t("bulk.finalizeImport")}
              </Button>
            </div>
          </div>
        )}

        {stage === "importing" && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-center font-semibold">{t("bulk.importing")}...</p>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-center text-muted-foreground">{progress}%</p>
          </div>
        )}

        {stage === "done" && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-cash flex items-center justify-center">
              <Check className="h-8 w-8 text-cash-foreground" />
            </div>
            <p className="text-lg font-bold">{t("bulk.importComplete")}</p>
            <p className="text-sm text-muted-foreground text-center">
              {t("bulk.importedCount").replace("{count}", String(importedCount))}
              {skippedCount > 0 && ` · ${t("bulk.skippedCount").replace("{count}", String(skippedCount))}`}
            </p>
            <Button onClick={() => { reset(); onOpenChange(false); }} className="w-full">
              {t("common.back")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

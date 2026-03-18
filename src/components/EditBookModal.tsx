import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Book } from "@/types/book";

interface EditBookModalProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBookModal({ book, open, onOpenChange }: EditBookModalProps) {
  const { t } = useLanguage();
  const { updateBook } = useStore();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [royalty, setRoyalty] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setPrice(book.salePrice.toString());
      setQuantity(book.quantity.toString());
      setRoyalty((book.royaltyPercentage ?? 0).toString());
    }
  }, [book]);

  const handleSave = async () => {
    if (!book) return;
    const p = parseFloat(price);
    const q = parseInt(quantity);
    if (isNaN(p) || p <= 0 || isNaN(q) || q < 0) return;

    setSaving(true);
    await updateBook(book.isbn, {
      title: title.trim() || book.title,
      author: author.trim() || book.author,
      salePrice: p,
      quantity: q,
      royaltyPercentage: parseFloat(royalty) || 0,
    });
    setSaving(false);
    onOpenChange(false);
    toast.success(t("inv.bookUpdated"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("inv.editBook")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1 block">ISBN</label>
            <Input value={book?.isbn ?? ""} disabled className="h-11 bg-muted font-mono" />
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1 block">{t("inv.bookTitle")}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 bg-secondary" />
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1 block">{t("inv.author")}</label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} className="h-11 bg-secondary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-1 block">{t("inv.salePrice")}</label>
              <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11 text-lg font-bold bg-secondary text-center" />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-1 block">{t("inv.quantity")}</label>
              <Input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-11 text-lg font-bold bg-secondary text-center" />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-1 block">{t("inv.royaltyPct")}</label>
              <Input type="number" step="0.1" min="0" max="100" value={royalty} onChange={(e) => setRoyalty(e.target.value)} className="h-11 text-lg font-bold bg-secondary text-center" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={handleSave} disabled={saving || !price || parseFloat(price) <= 0}>
            {t("inv.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

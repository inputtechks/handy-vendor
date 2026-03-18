import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Book, Sale, TransactionType, PaymentMethod } from "@/types/book";

interface StoreContextType {
  books: Book[];
  sales: Sale[];
  loading: boolean;
  addBook: (book: Book) => Promise<void>;
  updateBook: (isbn: string, updates: Partial<Book>) => Promise<void>;
  removeBook: (isbn: string) => Promise<void>;
  getBook: (isbn: string) => Book | undefined;
  sellBook: (isbn: string, method: PaymentMethod, qty: number, discount: number, transactionType?: TransactionType, note?: string) => Promise<Sale | null>;
  recordMovement: (isbn: string, qty: number, transactionType: TransactionType, note?: string) => Promise<Sale | null>;
  searchBooks: (query: string) => Book[];
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBooks([]);
      setSales([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const [booksRes, salesRes] = await Promise.all([
        supabase.from("books").select("*").order("created_at", { ascending: false }),
        supabase.from("sales").select("*").order("sold_at", { ascending: false }),
      ]);

      if (booksRes.data) {
        setBooks(booksRes.data.map((b) => ({
          isbn: b.isbn,
          title: b.title,
          author: b.author,
          coverUrl: b.cover_url,
          salePrice: Number(b.sale_price),
          quantity: b.quantity,
          category: (b as any).category ?? "",
          royaltyPercentage: Number((b as any).royalty_percentage ?? 0),
        })));
      }

      if (salesRes.data) {
        setSales(salesRes.data.map((s) => ({
          id: s.id,
          isbn: s.isbn,
          title: s.title,
          price: Number(s.price),
          method: s.method as PaymentMethod,
          discount: Number(s.discount ?? 0),
          timestamp: new Date(s.sold_at).getTime(),
          transactionType: ((s as any).transaction_type ?? "retail") as TransactionType,
          note: (s as any).note ?? "",
        })));
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const addBook = useCallback(async (book: Book) => {
    if (!user) return;
    const existing = books.find((b) => b.isbn === book.isbn);
    if (existing) {
      const { error } = await supabase
        .from("books")
        .update({ quantity: existing.quantity + book.quantity, sale_price: book.salePrice })
        .eq("vendor_id", user.id)
        .eq("isbn", book.isbn);
      if (!error) {
        setBooks((prev) => prev.map((b) =>
          b.isbn === book.isbn ? { ...b, quantity: b.quantity + book.quantity, salePrice: book.salePrice } : b
        ));
      }
    } else {
      const { error } = await supabase.from("books").insert({
        vendor_id: user.id,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        cover_url: book.coverUrl,
        sale_price: book.salePrice,
        quantity: book.quantity,
        category: book.category,
      } as any);
      if (!error) {
        setBooks((prev) => [book, ...prev]);
      }
    }
  }, [user, books]);

  const updateBook = useCallback(async (isbn: string, updates: Partial<Book>) => {
    if (!user) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.author !== undefined) dbUpdates.author = updates.author;
    if (updates.coverUrl !== undefined) dbUpdates.cover_url = updates.coverUrl;
    if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;

    const { error } = await supabase.from("books").update(dbUpdates).eq("vendor_id", user.id).eq("isbn", isbn);
    if (!error) {
      setBooks((prev) => prev.map((b) => (b.isbn === isbn ? { ...b, ...updates } : b)));
    }
  }, [user]);

  const removeBook = useCallback(async (isbn: string) => {
    if (!user) return;
    const { error } = await supabase.from("books").delete().eq("vendor_id", user.id).eq("isbn", isbn);
    if (!error) {
      setBooks((prev) => prev.filter((b) => b.isbn !== isbn));
    }
  }, [user]);

  const getBook = useCallback(
    (isbn: string) => books.find((b) => b.isbn === isbn),
    [books]
  );

  const sellBook = useCallback(
    async (isbn: string, method: PaymentMethod, qty: number, discount: number, transactionType: TransactionType = "retail", note: string = ""): Promise<Sale | null> => {
      if (!user) return null;
      const book = books.find((b) => b.isbn === isbn);
      if (!book || book.quantity < qty) return null;

      const { error: updateError } = await supabase
        .from("books")
        .update({ quantity: book.quantity - qty })
        .eq("vendor_id", user.id)
        .eq("isbn", isbn);
      if (updateError) return null;

      const finalPrice = Math.max(0, (book.salePrice - discount) * qty);

      const { data, error: insertError } = await supabase
        .from("sales")
        .insert({
          vendor_id: user.id,
          isbn,
          title: book.title,
          price: finalPrice,
          method,
          discount,
          transaction_type: transactionType,
          note,
        })
        .select()
        .single();

      if (insertError || !data) return null;

      const sale: Sale = {
        id: data.id,
        isbn,
        title: book.title,
        price: finalPrice,
        method,
        discount,
        timestamp: new Date(data.sold_at).getTime(),
        transactionType,
        note,
      };

      setBooks((prev) =>
        prev.map((b) => (b.isbn === isbn ? { ...b, quantity: b.quantity - qty } : b))
      );
      setSales((prev) => [sale, ...prev]);
      return sale;
    },
    [user, books]
  );

  /** Record a stock movement (Pilon, SP, Dépôt deposit/return) with $0 revenue */
  const recordMovement = useCallback(
    async (isbn: string, qty: number, transactionType: TransactionType, note: string = ""): Promise<Sale | null> => {
      if (!user) return null;
      const book = books.find((b) => b.isbn === isbn);
      if (!book) return null;

      // depot_return adds stock back; everything else subtracts
      const newQty = transactionType === "depot_return"
        ? book.quantity + qty
        : book.quantity - qty;

      if (newQty < 0) return null;

      const { error: updateError } = await supabase
        .from("books")
        .update({ quantity: newQty })
        .eq("vendor_id", user.id)
        .eq("isbn", isbn);
      if (updateError) return null;

      const { data, error: insertError } = await supabase
        .from("sales")
        .insert({
          vendor_id: user.id,
          isbn,
          title: book.title,
          price: 0,
          method: "none",
          discount: 0,
          transaction_type: transactionType,
          note,
        })
        .select()
        .single();

      if (insertError || !data) return null;

      const sale: Sale = {
        id: data.id,
        isbn,
        title: book.title,
        price: 0,
        method: "none",
        discount: 0,
        timestamp: new Date(data.sold_at).getTime(),
        transactionType,
        note,
      };

      setBooks((prev) =>
        prev.map((b) => (b.isbn === isbn ? { ...b, quantity: newQty } : b))
      );
      setSales((prev) => [sale, ...prev]);
      return sale;
    },
    [user, books]
  );

  const searchBooks = useCallback(
    (query: string) => {
      const q = query.toLowerCase();
      return books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.includes(q)
      );
    },
    [books]
  );

  return (
    <StoreContext.Provider value={{ books, sales, loading, addBook, updateBook, removeBook, getBook, sellBook, recordMovement, searchBooks }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Book, Sale } from "@/types/book";

interface StoreContextType {
  books: Book[];
  sales: Sale[];
  addBook: (book: Book) => void;
  updateBook: (isbn: string, updates: Partial<Book>) => void;
  removeBook: (isbn: string) => void;
  getBook: (isbn: string) => Book | undefined;
  sellBook: (isbn: string, method: "cash" | "card") => Sale | null;
  searchBooks: (query: string) => Book[];
}

const StoreContext = createContext<StoreContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>(() => loadFromStorage("bb_books", []));
  const [sales, setSales] = useState<Sale[]>(() => loadFromStorage("bb_sales", []));

  useEffect(() => {
    localStorage.setItem("bb_books", JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem("bb_sales", JSON.stringify(sales));
  }, [sales]);

  const addBook = useCallback((book: Book) => {
    setBooks((prev) => {
      const existing = prev.find((b) => b.isbn === book.isbn);
      if (existing) {
        return prev.map((b) =>
          b.isbn === book.isbn
            ? { ...b, quantity: b.quantity + book.quantity, salePrice: book.salePrice }
            : b
        );
      }
      return [...prev, book];
    });
  }, []);

  const updateBook = useCallback((isbn: string, updates: Partial<Book>) => {
    setBooks((prev) => prev.map((b) => (b.isbn === isbn ? { ...b, ...updates } : b)));
  }, []);

  const removeBook = useCallback((isbn: string) => {
    setBooks((prev) => prev.filter((b) => b.isbn !== isbn));
  }, []);

  const getBook = useCallback(
    (isbn: string) => books.find((b) => b.isbn === isbn),
    [books]
  );

  const sellBook = useCallback(
    (isbn: string, method: "cash" | "card"): Sale | null => {
      const book = books.find((b) => b.isbn === isbn);
      if (!book || book.quantity <= 0) return null;

      const sale: Sale = {
        id: crypto.randomUUID(),
        isbn,
        title: book.title,
        price: book.salePrice,
        method,
        timestamp: Date.now(),
      };

      setBooks((prev) =>
        prev.map((b) => (b.isbn === isbn ? { ...b, quantity: b.quantity - 1 } : b))
      );
      setSales((prev) => [sale, ...prev]);
      return sale;
    },
    [books]
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
    <StoreContext.Provider value={{ books, sales, addBook, updateBook, removeBook, getBook, sellBook, searchBooks }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

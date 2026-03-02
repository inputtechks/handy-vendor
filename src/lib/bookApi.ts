const OPEN_LIBRARY_API = "https://openlibrary.org/api/books";

interface BookLookupResult {
  title: string;
  author: string;
  coverUrl: string;
}

export async function lookupBookByISBN(isbn: string): Promise<BookLookupResult | null> {
  try {
    const res = await fetch(
      `${OPEN_LIBRARY_API}?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    const data = await res.json();
    const entry = data[`ISBN:${isbn}`];
    if (!entry) return null;

    return {
      title: entry.title || "Unknown Title",
      author: entry.authors?.[0]?.name || "Unknown Author",
      coverUrl: entry.cover?.medium || entry.cover?.small || "",
    };
  } catch {
    return null;
  }
}

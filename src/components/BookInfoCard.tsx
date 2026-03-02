import { Book } from "@/types/book";

interface BookInfoCardProps {
  book: Pick<Book, "title" | "author" | "coverUrl"> & { salePrice?: number; quantity?: number };
  compact?: boolean;
}

export function BookInfoCard({ book, compact }: BookInfoCardProps) {
  return (
    <div className={`flex gap-4 rounded-lg bg-secondary p-4 ${compact ? "items-center" : "items-start"}`}>
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={book.title}
          className={`rounded-md object-cover ${compact ? "h-16 w-12" : "h-24 w-16"} bg-muted`}
          loading="lazy"
        />
      ) : (
        <div className={`flex items-center justify-center rounded-md bg-muted text-muted-foreground text-xs font-bold ${compact ? "h-16 w-12" : "h-24 w-16"}`}>
          No Cover
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold truncate ${compact ? "text-base" : "text-lg"}`}>{book.title}</h3>
        <p className="text-muted-foreground text-sm truncate">{book.author}</p>
        {book.salePrice !== undefined && (
          <p className="mt-1 text-primary font-extrabold text-xl">${book.salePrice.toFixed(2)}</p>
        )}
        {book.quantity !== undefined && (
          <p className={`text-sm font-medium mt-0.5 ${book.quantity <= 1 ? "text-warning" : "text-muted-foreground"}`}>
            {book.quantity} in stock
          </p>
        )}
      </div>
    </div>
  );
}

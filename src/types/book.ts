export interface Book {
  isbn: string;
  title: string;
  author: string;
  coverUrl: string;
  salePrice: number;
  quantity: number;
}

export interface Sale {
  id: string;
  isbn: string;
  title: string;
  price: number;
  method: "cash" | "card";
  timestamp: number;
}

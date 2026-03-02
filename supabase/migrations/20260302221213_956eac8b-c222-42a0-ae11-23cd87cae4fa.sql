
-- Books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  isbn TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Unknown Title',
  author TEXT NOT NULL DEFAULT 'Unknown Author',
  cover_url TEXT NOT NULL DEFAULT '',
  sale_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, isbn)
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own books" ON public.books FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can insert own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "Vendors can update own books" ON public.books FOR UPDATE USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can delete own books" ON public.books FOR DELETE USING (auth.uid() = vendor_id);

-- Sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  isbn TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'card')),
  sold_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own sales" ON public.sales FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can insert own sales" ON public.sales FOR INSERT WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "Vendors can delete own sales" ON public.sales FOR DELETE USING (auth.uid() = vendor_id);

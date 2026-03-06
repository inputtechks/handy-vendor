-- Add transaction_type and note columns
ALTER TABLE public.sales ADD COLUMN transaction_type text NOT NULL DEFAULT 'retail';
ALTER TABLE public.sales ADD COLUMN note text NOT NULL DEFAULT '';

-- Drop old method constraint and add new one allowing null for zero-revenue movements
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_method_check;

-- Add transaction_type constraint
ALTER TABLE public.sales ADD CONSTRAINT sales_transaction_type_check 
CHECK (transaction_type = ANY (ARRAY['retail'::text, 'depot_deposit'::text, 'depot_sold'::text, 'depot_return'::text, 'auteur'::text, 'internet'::text, 'pilon'::text, 'sp'::text]));

-- For pilon and sp, method can be empty string since no payment is involved
ALTER TABLE public.sales ADD CONSTRAINT sales_method_check 
CHECK (method = ANY (ARRAY['cash'::text, 'card'::text, 'twint'::text, 'none'::text]));
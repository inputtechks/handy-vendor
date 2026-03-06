ALTER TABLE public.sales DROP CONSTRAINT sales_method_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_method_check CHECK (method = ANY (ARRAY['cash'::text, 'card'::text, 'twint'::text]));
-- Saved start addresses shared by all authenticated users (Från shortcuts).

CREATE TABLE public.origin_address_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  address text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT origin_address_favorites_address_unique UNIQUE (address)
);

CREATE INDEX origin_address_favorites_sort_order_idx
  ON public.origin_address_favorites (sort_order, created_at);

ALTER TABLE public.origin_address_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY origin_address_favorites_authenticated_all
  ON public.origin_address_favorites
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

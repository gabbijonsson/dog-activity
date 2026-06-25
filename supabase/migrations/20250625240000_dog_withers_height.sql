-- Add optional withers height (Mankhöjd) in centimeters for dogs

ALTER TABLE public.dogs
  ADD COLUMN withers_height_cm smallint;

ALTER TABLE public.dogs
  ADD CONSTRAINT dogs_withers_height_cm_check
  CHECK (withers_height_cm IS NULL OR (withers_height_cm > 0 AND withers_height_cm <= 120));

COMMENT ON COLUMN public.dogs.withers_height_cm IS 'Withers height (Mankhöjd) in centimeters';

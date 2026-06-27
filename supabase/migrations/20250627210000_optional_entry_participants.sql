-- Allow entries without dog/handler until sign-up (interested status).
ALTER TABLE public.entries
  ALTER COLUMN dog_id DROP NOT NULL,
  ALTER COLUMN handler_id DROP NOT NULL;

DROP INDEX IF EXISTS public.entries_competition_dog_unique;
DROP INDEX IF EXISTS public.entries_nosework_handler_unique;

CREATE UNIQUE INDEX entries_competition_dog_unique
  ON public.entries (competition_id, dog_id)
  WHERE dog_id IS NOT NULL;

CREATE UNIQUE INDEX entries_nosework_handler_unique
  ON public.entries (competition_id, handler_id)
  WHERE sport = 'nosework' AND handler_id IS NOT NULL;

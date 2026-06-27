-- Rally level, entry results, and dog promotion history

CREATE TYPE public.rally_level AS ENUM (
  'nyborjare',
  'fortsattning',
  'avancerad',
  'mastare'
);

CREATE TYPE public.nosework_diploma_result AS ENUM ('inget_diplom', 'diplom');

CREATE TYPE public.competition_placement AS ENUM (
  'ingen',
  'place_1',
  'place_2',
  'place_3'
);

ALTER TABLE public.rally_details
  ADD COLUMN level public.rally_level NOT NULL DEFAULT 'nyborjare';

CREATE TABLE public.nosework_entry_results (
  entry_id uuid PRIMARY KEY REFERENCES public.entries (id) ON DELETE CASCADE,
  diploma_result public.nosework_diploma_result,
  search_1_placement public.competition_placement NOT NULL DEFAULT 'ingen',
  search_2_placement public.competition_placement NOT NULL DEFAULT 'ingen',
  search_3_placement public.competition_placement NOT NULL DEFAULT 'ingen',
  search_4_placement public.competition_placement NOT NULL DEFAULT 'ingen',
  total_placement public.competition_placement NOT NULL DEFAULT 'ingen'
);

CREATE TABLE public.rally_start_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries (id) ON DELETE CASCADE,
  start_number smallint NOT NULL CHECK (start_number BETWEEN 1 AND 3),
  points smallint CHECK (points IS NULL OR (points >= 0 AND points <= 100)),
  CONSTRAINT rally_start_results_entry_start_unique UNIQUE (entry_id, start_number)
);

CREATE TABLE public.dog_nosework_diploma_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES public.dogs (id) ON DELETE CASCADE,
  type public.nosework_type NOT NULL,
  class public.nosework_class NOT NULL,
  count smallint NOT NULL DEFAULT 0 CHECK (count >= 0),
  CONSTRAINT dog_nosework_diploma_counts_unique UNIQUE (dog_id, type, class)
);

CREATE TABLE public.dog_rally_qualified_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES public.dogs (id) ON DELETE CASCADE,
  level public.rally_level NOT NULL,
  count smallint NOT NULL DEFAULT 0 CHECK (count >= 0),
  CONSTRAINT dog_rally_qualified_counts_unique UNIQUE (dog_id, level)
);

ALTER TABLE public.nosework_entry_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rally_start_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_nosework_diploma_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_rally_qualified_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY nosework_entry_results_authenticated_all
  ON public.nosework_entry_results
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY rally_start_results_authenticated_all
  ON public.rally_start_results
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY dog_nosework_diploma_counts_authenticated_all
  ON public.dog_nosework_diploma_counts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY dog_rally_qualified_counts_authenticated_all
  ON public.dog_rally_qualified_counts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

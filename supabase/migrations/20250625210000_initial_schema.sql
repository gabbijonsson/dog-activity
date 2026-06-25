-- Dog Sports Competition Tracker — initial schema (Epic 1)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM ('admin', 'user');
CREATE TYPE public.sport AS ENUM ('nosework', 'rally_obedience');
CREATE TYPE public.nosework_type AS ENUM (
  'tsm',
  'tem_behallare',
  'tem_inomhus',
  'tem_fordon',
  'tem_utomhus'
);
CREATE TYPE public.nosework_class AS ENUM ('class_1', 'class_2', 'class_3', 'elit');
CREATE TYPE public.nosework_official_status AS ENUM ('official', 'unofficial', 'summit');
CREATE TYPE public.rally_starts AS ENUM ('single', 'double', 'triple');
CREATE TYPE public.entry_status AS ENUM (
  'interested',
  'signed_up',
  'slot_assigned',
  'reserve_slot',
  'paid'
);
CREATE TYPE public.calendar_event_type AS ENUM (
  'sign_up_open',
  'sign_up_close',
  'payment',
  'event_day'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role public.user_role NOT NULL DEFAULT 'user'
);

CREATE TABLE public.dogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  breed text,
  date_of_birth date,
  notes text,
  created_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sport public.sport NOT NULL,
  location text,
  location_lat double precision,
  location_lng double precision,
  origin_location text,
  drive_distance_meters integer,
  drive_distance_text text,
  drive_duration_seconds integer,
  drive_duration_text text,
  drive_computed_at timestamptz,
  sign_up_opens date NOT NULL,
  sign_up_closes date NOT NULL,
  payment_deadline date NOT NULL,
  event_date date NOT NULL,
  url text,
  notes text,
  created_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT competitions_date_order_check CHECK (
    sign_up_opens <= sign_up_closes
    AND sign_up_closes <= payment_deadline
    AND sign_up_opens <= event_date
    AND sign_up_closes <= event_date
  )
);

CREATE TABLE public.nosework_details (
  competition_id uuid PRIMARY KEY REFERENCES public.competitions (id) ON DELETE CASCADE,
  type public.nosework_type NOT NULL,
  class public.nosework_class NOT NULL,
  official_status public.nosework_official_status NOT NULL
);

CREATE TABLE public.rally_details (
  competition_id uuid PRIMARY KEY REFERENCES public.competitions (id) ON DELETE CASCADE,
  number_of_starts public.rally_starts NOT NULL
);

-- Denormalized sport enables partial unique indexes (PG partial predicates cannot subquery)
CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions (id) ON DELETE CASCADE,
  dog_id uuid NOT NULL REFERENCES public.dogs (id) ON DELETE RESTRICT,
  handler_id uuid NOT NULL REFERENCES public.profiles (id),
  status public.entry_status NOT NULL DEFAULT 'interested',
  sport public.sport NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions (id) ON DELETE CASCADE,
  event_type public.calendar_event_type NOT NULL,
  event_date date NOT NULL,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calendar_events_competition_type_unique UNIQUE (competition_id, event_type)
);

-- ---------------------------------------------------------------------------
-- Entry uniqueness (partial indexes per sport rules)
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX entries_competition_dog_unique ON public.entries (competition_id, dog_id);

CREATE UNIQUE INDEX entries_nosework_handler_unique
  ON public.entries (competition_id, handler_id)
  WHERE sport = 'nosework';

-- ---------------------------------------------------------------------------
-- Functions & triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    'user'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_entry_sport()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  SELECT c.sport
  INTO NEW.sport
  FROM public.competitions AS c
  WHERE c.id = NEW.competition_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'competition % not found', NEW.competition_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER entries_set_sport
  BEFORE INSERT OR UPDATE OF competition_id
  ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_entry_sport();

CREATE OR REPLACE FUNCTION public.sync_competition_calendar_events()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM public.calendar_events
    WHERE competition_id = NEW.id;
  END IF;

  INSERT INTO public.calendar_events (competition_id, event_type, event_date, title)
  VALUES
    (
      NEW.id,
      'sign_up_open',
      NEW.sign_up_opens,
      NEW.name || ' — Sign-up opens'
    ),
    (
      NEW.id,
      'sign_up_close',
      NEW.sign_up_closes,
      NEW.name || ' — Sign-up closes'
    ),
    (
      NEW.id,
      'payment',
      NEW.payment_deadline,
      NEW.name || ' — Payment due'
    ),
    (
      NEW.id,
      'event_day',
      NEW.event_date,
      NEW.name || ' — Event day'
    );

  RETURN NEW;
END;
$$;

CREATE TRIGGER competitions_sync_calendar_events
  AFTER INSERT OR UPDATE OF sign_up_opens, sign_up_closes, payment_deadline, event_date, name
  ON public.competitions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_competition_calendar_events();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nosework_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rally_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_authenticated_all
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY dogs_authenticated_all
  ON public.dogs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY competitions_authenticated_all
  ON public.competitions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY nosework_details_authenticated_all
  ON public.nosework_details
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY rally_details_authenticated_all
  ON public.rally_details
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY entries_authenticated_all
  ON public.entries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY calendar_events_authenticated_all
  ON public.calendar_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grants for API roles (RLS still applies)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Competition milestones are datetimes; payment deadline defaults to end of day.

ALTER TABLE public.competitions
  ALTER COLUMN sign_up_opens TYPE timestamptz
    USING ((sign_up_opens + TIME '09:00') AT TIME ZONE 'Europe/Stockholm'),
  ALTER COLUMN sign_up_closes TYPE timestamptz
    USING ((sign_up_closes + TIME '17:00') AT TIME ZONE 'Europe/Stockholm'),
  ALTER COLUMN payment_deadline TYPE timestamptz
    USING ((payment_deadline + TIME '23:59:59') AT TIME ZONE 'Europe/Stockholm'),
  ALTER COLUMN event_date TYPE timestamptz
    USING ((event_date + TIME '08:00') AT TIME ZONE 'Europe/Stockholm');

ALTER TABLE public.calendar_events
  ALTER COLUMN event_date TYPE timestamptz
    USING (
      CASE event_type
        WHEN 'payment' THEN (event_date + TIME '23:59:59') AT TIME ZONE 'Europe/Stockholm'
        WHEN 'sign_up_open' THEN (event_date + TIME '09:00') AT TIME ZONE 'Europe/Stockholm'
        WHEN 'sign_up_close' THEN (event_date + TIME '17:00') AT TIME ZONE 'Europe/Stockholm'
        ELSE (event_date + TIME '08:00') AT TIME ZONE 'Europe/Stockholm'
      END
    );

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

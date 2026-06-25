-- Event type is shown in the UI via color and labels; titles are competition names only.

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
    (NEW.id, 'sign_up_open', NEW.sign_up_opens, NEW.name),
    (NEW.id, 'sign_up_close', NEW.sign_up_closes, NEW.name),
    (NEW.id, 'payment', NEW.payment_deadline, NEW.name),
    (NEW.id, 'event_day', NEW.event_date, NEW.name);

  RETURN NEW;
END;
$$;

UPDATE public.calendar_events ce
SET title = c.name
FROM public.competitions c
WHERE ce.competition_id = c.id;

-- Optional emoji per handler, shown on calendar entries for their competitions.

ALTER TABLE public.profiles
  ADD COLUMN calendar_emoji text;

COMMENT ON COLUMN public.profiles.calendar_emoji IS
  'Optional emoji for this handler on calendar competition events.';

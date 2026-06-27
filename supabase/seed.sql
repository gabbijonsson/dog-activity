-- Seed data for Dog Sports Competition Tracker (Epic 1)
-- Default login: dev@dog-activity.local / password123

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  v_dog_1 uuid := 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  v_dog_2 uuid := 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  v_comp_nw uuid := 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  v_comp_rally uuid := 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'dev@dog-activity.local',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Dev User"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    format('{"sub":"%s","email":"dev@dog-activity.local"}', v_user_id)::jsonb,
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  UPDATE public.profiles
  SET full_name = 'Dev User', role = 'admin'
  WHERE id = v_user_id;

  INSERT INTO public.dogs (id, name, breed, date_of_birth, notes, created_by)
  VALUES
    (
      v_dog_1,
      'Luna',
      'Border Collie',
      '2019-03-15',
      'High drive, loves container searches.',
      v_user_id
    ),
    (
      v_dog_2,
      'Atlas',
      'Shetland Sheepdog',
      '2020-07-22',
      'Solid rally foundation work.',
      v_user_id
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.competitions (
    id,
    name,
    sport,
    location,
    origin_location,
    sign_up_opens,
    sign_up_closes,
    payment_deadline,
    event_date,
    url,
    notes,
    created_by
  )
  VALUES
    (
      v_comp_nw,
      'Spring NoseWork Trial',
      'nosework',
      'Stockholm Dog Arena, Stockholm',
      'Uppsala, Sweden',
      ((CURRENT_DATE + 14)::timestamp + TIME '09:00') AT TIME ZONE 'Europe/Stockholm',
      ((CURRENT_DATE + 28)::timestamp + TIME '17:00') AT TIME ZONE 'Europe/Stockholm',
      ((CURRENT_DATE + 35)::timestamp + TIME '23:59:59') AT TIME ZONE 'Europe/Stockholm',
      ((CURRENT_DATE + 42)::timestamp + TIME '08:00') AT TIME ZONE 'Europe/Stockholm',
      'https://example.com/nosework-spring',
      'Outdoor vehicle search planned.',
      v_user_id
    ),
    (
      v_comp_rally,
      'Nordic Rally Championship',
      'rally_obedience',
      'Göteborg Event Center, Göteborg',
      'Uppsala, Sweden',
      ((CURRENT_DATE + 7)::timestamp + TIME '10:00') AT TIME ZONE 'Europe/Stockholm',
      ((CURRENT_DATE + 21)::timestamp + TIME '18:00') AT TIME ZONE 'Europe/Stockholm',
      ((CURRENT_DATE + 28)::timestamp + TIME '23:59:59') AT TIME ZONE 'Europe/Stockholm',
      ((CURRENT_DATE + 35)::timestamp + TIME '09:30') AT TIME ZONE 'Europe/Stockholm',
      'https://example.com/rally-nordic',
      'Double starts available.',
      v_user_id
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.nosework_details (competition_id, type, class, official_status)
  VALUES (v_comp_nw, 'tem_utomhus', 'class_2', 'official')
  ON CONFLICT (competition_id) DO NOTHING;

  INSERT INTO public.rally_details (competition_id, number_of_starts, level)
  VALUES (v_comp_rally, 'double', 'fortsattning')
  ON CONFLICT (competition_id) DO NOTHING;

  DELETE FROM public.entries
  WHERE competition_id IN (v_comp_nw, v_comp_rally);

  INSERT INTO public.entries (competition_id, dog_id, handler_id, status)
  VALUES
    (v_comp_nw, v_dog_1, v_user_id, 'signed_up'),
    (v_comp_rally, v_dog_2, v_user_id, 'interested'),
    (v_comp_rally, v_dog_1, v_user_id, 'slot_assigned');
END $$;

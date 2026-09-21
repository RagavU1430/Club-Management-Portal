-- =========================================================
-- FIX: Public event registration 401 / RLS violation
-- Root cause: client does INSERT ... SELECT (returning row).
-- anon has INSERT policy but NO SELECT policy, so PostgREST
-- rejects the insert with "new row violates row-level security".
-- Fix: SECURITY DEFINER RPC that bypasses RLS for the insert
-- + duplicate/capacity checks + explicit anon INSERT policy.
-- HOW TO APPLY: Supabase Dashboard > SQL Editor > New query >
-- paste this whole file > Run.
-- =========================================================

-- 1. Make sure anon + authenticated can INSERT (needed even for RPC fallback)
DROP POLICY IF EXISTS "Public register events" ON event_registrations;
CREATE POLICY "Public register events"
  ON event_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Keep admin management (recreate if missing)
DROP POLICY IF EXISTS "Authenticated manage registrations" ON event_registrations;
CREATE POLICY "Authenticated manage registrations"
  ON event_registrations FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- 2. Secure registration function (bypasses RLS, runs as owner)
CREATE OR REPLACE FUNCTION register_for_event(
  p_event_id BIGINT,
  p_team_name TEXT DEFAULT '',
  p_member1 TEXT DEFAULT '',
  p_member2 TEXT DEFAULT '',
  p_email TEXT DEFAULT '',
  p_phone TEXT DEFAULT '',
  p_department TEXT DEFAULT '',
  p_college TEXT DEFAULT '',
  p_roll_number TEXT DEFAULT '',
  p_section TEXT DEFAULT '',
  p_member2_email TEXT DEFAULT '',
  p_member2_roll_number TEXT DEFAULT '',
  p_year TEXT DEFAULT '',
  p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_count INT := 0;
  v_existing event_registrations%ROWTYPE;
  v_new_id BIGINT;
  v_clean_email TEXT;
BEGIN
  v_clean_email := lower(trim(p_email));
  IF v_clean_email = '' OR v_clean_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'Please provide a valid email address.';
  END IF;

  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found.';
  END IF;

  -- Capacity check
  IF COALESCE(v_event.capacity, 0) > 0 THEN
    SELECT count(*) INTO v_count FROM event_registrations WHERE event_id = p_event_id;
    IF v_count >= v_event.capacity THEN
      RAISE EXCEPTION 'Registration is full. Capacity of % has been reached.', v_event.capacity;
    END IF;
  END IF;

  -- Duplicate check (one mail ID = one team per event)
  SELECT * INTO v_existing
  FROM event_registrations
  WHERE event_id = p_event_id AND lower(email) = v_clean_email
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'alreadyRegistered', true,
      'registration', row_to_json(v_existing),
      'eventTitle', v_event.title,
      'eventDate', v_event.date,
      'venue', v_event.venue
    );
  END IF;

  -- Insert new registration
  INSERT INTO event_registrations (
    event_id, team_name, member1, member2, name, email, phone,
    member2_phone, department, college, roll_number, section,
    member2_email, member2_roll_number, year, notes, attended
  ) VALUES (
    p_event_id,
    trim(p_team_name),
    trim(p_member1),
    trim(p_member2),
    trim(p_member1),
    v_clean_email,
    trim(p_phone),
    '',
    trim(COALESCE(NULLIF(p_department, ''), NULLIF(p_college, ''), 'AI & Data Science')),
    trim(COALESCE(NULLIF(p_college, ''), NULLIF(p_department, ''), 'AI & Data Science')),
    trim(p_roll_number),
    trim(p_section),
    lower(trim(p_member2_email)),
    trim(p_member2_roll_number),
    trim(p_year),
    trim(p_notes),
    0
  ) RETURNING id INTO v_new_id;

  SELECT * INTO v_existing FROM event_registrations WHERE id = v_new_id;

  RETURN jsonb_build_object(
    'alreadyRegistered', false,
    'registration', row_to_json(v_existing),
    'eventTitle', v_event.title,
    'eventDate', v_event.date,
    'venue', v_event.venue
  );
END;
$$;

REVOKE ALL ON FUNCTION register_for_event(BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_for_event(BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

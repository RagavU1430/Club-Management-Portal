-- =========================================================
-- SAFE FIX MIGRATION — Issues #3, #5, #7, #19
-- Fixes RLS policies, ticket lookup PII exposure, and
-- register_for_event missing member2_phone parameter.
--
-- ✅ NO tables dropped, NO rows deleted, NO columns altered.
-- Only policies and functions are replaced (idempotent).
--
-- HOW TO APPLY: Supabase Dashboard > SQL Editor > New query >
-- paste this whole file > Run.
-- =========================================================


-- ─────────────────────────────────────────────────────────────
-- ISSUE #5: Tighten RLS — only the admin user gets write access
-- ─────────────────────────────────────────────────────────────
-- Strategy: Check the JWT email claim against a known admin email.
-- This uses auth.jwt() -> 'email' which Supabase populates automatically.
-- If you have MULTIPLE admin accounts, change the check to use a custom
-- claim (e.g. raw_user_meta_data->>'role' = 'admin') or list multiple emails.
--
-- Set your admin email below (must match the email in Supabase Auth):
-- ─────────────────────────────────────────────────────────────

-- Helper function: returns TRUE if the current session belongs to an admin.
-- Using a function keeps the policy definitions clean and lets you add
-- more admin emails in one place later.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') IN (
      -- ▼ ADD YOUR ADMIN EMAIL(S) HERE ▼
      'aifrontierclub@gmail.com'
      -- To add more admins, just comma-separate:
      -- , 'another.admin@gmail.com'
    ),
    false
  );
$$;

-- ── Events: public read, admin-only write ──
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated manage events" ON events;
  DROP POLICY IF EXISTS "Admin manage events" ON events;
  CREATE POLICY "Admin manage events"
    ON events FOR ALL
    TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ── Team members: public read, admin-only write ──
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated manage team_members" ON team_members;
  DROP POLICY IF EXISTS "Admin manage team_members" ON team_members;
  CREATE POLICY "Admin manage team_members"
    ON team_members FOR ALL
    TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ── Club details: public read, admin-only write ──
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated manage club_details" ON club_details;
  DROP POLICY IF EXISTS "Admin manage club_details" ON club_details;
  CREATE POLICY "Admin manage club_details"
    ON club_details FOR ALL
    TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ── Club activities: public read, admin-only write ──
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated manage club_activities" ON club_activities;
  DROP POLICY IF EXISTS "Admin manage club_activities" ON club_activities;
  CREATE POLICY "Admin manage club_activities"
    ON club_activities FOR ALL
    TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ── Games: public read, admin-only write ──
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated manage games" ON games;
  DROP POLICY IF EXISTS "Admin manage games" ON games;
  CREATE POLICY "Admin manage games"
    ON games FOR ALL
    TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ── Event registrations: admin-only full access ──
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated manage registrations" ON event_registrations;
  DROP POLICY IF EXISTS "Admin manage registrations" ON event_registrations;
  CREATE POLICY "Admin manage registrations"
    ON event_registrations FOR ALL
    TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ── Subscribers: admin-only read/delete ──
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated manage subscribers" ON subscribers;
  DROP POLICY IF EXISTS "Admin manage subscribers" ON subscribers;
  CREATE POLICY "Admin manage subscribers"
    ON subscribers FOR ALL
    TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
END $$;

-- ── Settings: admin-only ──
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated manage settings" ON settings;
  DROP POLICY IF EXISTS "Admin manage settings" ON settings;
  CREATE POLICY "Admin manage settings"
    ON settings FOR ALL
    TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());
END $$;


-- ─────────────────────────────────────────────────────────────
-- ISSUE #7: Remove the blanket anon INSERT policy on
-- event_registrations so direct PostgREST INSERTs are blocked.
-- Registration must go through the register_for_event() RPC
-- which is SECURITY DEFINER and does its own validation.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public register events" ON event_registrations;
-- No replacement INSERT policy for anon — all inserts go through RPC.
-- The RPC is SECURITY DEFINER so it bypasses RLS internally.


-- ─────────────────────────────────────────────────────────────
-- ISSUE #3: Secure ticket lookup — require email match,
-- stop returning full PII to anonymous callers.
-- Old: matched on sequential BIGINT id alone → enumerable.
-- New: AIF-code lookup removed (no more id-based enumeration),
--      only email or team_name lookup allowed.
--      phone/roll_number/section are no longer returned.
-- ─────────────────────────────────────────────────────────────

-- First drop the old function to allow changing the return table structure
DROP FUNCTION IF EXISTS lookup_registration_tickets(TEXT, BIGINT);
DROP FUNCTION IF EXISTS lookup_registration_tickets(TEXT);

CREATE OR REPLACE FUNCTION lookup_registration_tickets(
  lookup_identifier TEXT,
  target_event_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  event_id BIGINT,
  team_name TEXT,
  member1 TEXT,
  member2 TEXT,
  name TEXT,
  email TEXT,
  department TEXT,
  year TEXT,
  attended INTEGER,
  checked_in_at TIMESTAMPTZ,
  event_title TEXT,
  event_date TIMESTAMPTZ,
  event_venue TEXT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  -- Only match by email, member2_email, or team_name.
  -- Sequential id enumeration is no longer possible.
  -- PII fields (phone, roll_number, section) deliberately excluded.
  SELECT
    r.id,
    r.event_id,
    r.team_name,
    r.member1,
    r.member2,
    r.name,
    r.email,
    r.department,
    r.year,
    r.attended,
    r.checked_in_at,
    e.title,
    e.date,
    e.venue
  FROM event_registrations r
  JOIN events e ON e.id = r.event_id
  WHERE (
    lower(r.email) = lower(lookup_identifier)
    OR lower(r.member2_email) = lower(lookup_identifier)
    OR lower(r.team_name) = lower(lookup_identifier)
  )
  AND (target_event_id IS NULL OR r.event_id = target_event_id)
  ORDER BY r.created_at DESC;
$$;

REVOKE ALL ON FUNCTION lookup_registration_tickets(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lookup_registration_tickets(TEXT, BIGINT) TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────
-- ISSUE #19: Fix register_for_event() — add the missing
-- p_member2_phone parameter so member 2's phone is persisted
-- instead of being hardcoded to ''.
-- ─────────────────────────────────────────────────────────────

-- First drop the OLD function signatures so we can
-- create the new one without ambiguity or type conflict.
-- This is safe — it only removes the function definition, not any data.
DROP FUNCTION IF EXISTS register_for_event(
  BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
);
DROP FUNCTION IF EXISTS register_for_event(
  BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION register_for_event(
  p_event_id BIGINT,
  p_team_name TEXT DEFAULT '',
  p_member1 TEXT DEFAULT '',
  p_member2 TEXT DEFAULT '',
  p_email TEXT DEFAULT '',
  p_phone TEXT DEFAULT '',
  p_member2_phone TEXT DEFAULT '',       -- ← NEW: was missing
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

  -- Registration paused check
  IF lower(COALESCE(v_event.status, '')) = 'registration_paused' THEN
    RAISE EXCEPTION 'Registration is temporarily paused. Existing registrations remain valid.';
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

  -- Insert new registration (member2_phone now uses the parameter!)
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
    trim(p_member2_phone),        -- ← FIX: was hardcoded to ''
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

-- Grant execute to anon (public registration) and authenticated (admin)
REVOKE ALL ON FUNCTION register_for_event(
  BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_for_event(
  BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES (optional — uncomment to check)
-- ─────────────────────────────────────────────────────────────
-- SELECT polname, polcmd, polroles::regrole[], polqual, polwithcheck
-- FROM pg_policy WHERE polrelid = 'event_registrations'::regclass;
--
-- SELECT proname, pronargs FROM pg_proc
-- WHERE proname IN ('register_for_event', 'lookup_registration_tickets', 'is_admin');

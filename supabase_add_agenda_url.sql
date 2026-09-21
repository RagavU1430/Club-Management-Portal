-- =========================================================
-- ADD: events.agenda_url (agenda file opened in a new tab)
-- + allow PDF/Word uploads in club-uploads bucket
-- HOW TO APPLY: Supabase Dashboard > SQL Editor > New query >
-- paste this whole file > Run. Safe to re-run.
-- =========================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS agenda_url TEXT DEFAULT '';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
WHERE id = 'club-uploads';

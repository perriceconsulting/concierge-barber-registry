-- Add outreach notes thread (append-only, author-attributed)
-- Applied manually via Neon MCP per project schema-vs-migration drift workaround.

CREATE TABLE IF NOT EXISTS "outreach_note_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "author_id" UUID,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "outreach_note_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "outreach_note_entries_profile_id_idx" ON "outreach_note_entries"("profile_id");
CREATE INDEX IF NOT EXISTS "outreach_note_entries_created_at_idx" ON "outreach_note_entries"("created_at");

DO $$ BEGIN
  ALTER TABLE "outreach_note_entries"
    ADD CONSTRAINT "outreach_note_entries_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "outreach_note_entries"
    ADD CONSTRAINT "outreach_note_entries_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Backfill legacy single-field notes as the first thread entry (idempotent).
INSERT INTO "outreach_note_entries" ("profile_id", "author_id", "body", "created_at")
SELECT p."id", NULL, p."outreach_notes", COALESCE(p."outreach_updated_at", CURRENT_TIMESTAMP)
FROM "barber_profiles" p
WHERE p."outreach_notes" IS NOT NULL
  AND length(btrim(p."outreach_notes")) > 0
  AND NOT EXISTS (SELECT 1 FROM "outreach_note_entries" e WHERE e."profile_id" = p."id");

-- CBR v2.0 — W4 Grooming Passport (encrypted vault + share tokens)
-- Applied manually via Neon MCP per project schema-vs-migration drift workaround.

CREATE TABLE IF NOT EXISTS "grooming_passports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_user_id" UUID NOT NULL,
    "encrypted_specs" BYTEA NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "grooming_passports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "passport_share_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "passport_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "redeemed_at" TIMESTAMP(3),
    "redeemed_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "passport_share_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "grooming_passports_client_user_id_key" ON "grooming_passports"("client_user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "passport_share_tokens_token_hash_key" ON "passport_share_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "passport_share_tokens_passport_id_idx" ON "passport_share_tokens"("passport_id");
CREATE INDEX IF NOT EXISTS "passport_share_tokens_expires_at_idx" ON "passport_share_tokens"("expires_at");

DO $$ BEGIN
  ALTER TABLE "grooming_passports" ADD CONSTRAINT "grooming_passports_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "passport_share_tokens" ADD CONSTRAINT "passport_share_tokens_passport_id_fkey" FOREIGN KEY ("passport_id") REFERENCES "grooming_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

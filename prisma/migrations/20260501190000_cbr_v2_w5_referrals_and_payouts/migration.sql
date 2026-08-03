-- CBR v2.0 — W5 Referral & royalty ledger
-- Applied manually via Neon MCP (per project schema-vs-migration drift workaround).

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'approved', 'paid', 'disputed', 'declined');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "referrals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referring_barber_id" UUID NOT NULL,
    "performing_barber_id" UUID NOT NULL,
    "client_first_name" VARCHAR(100),
    "client_city" VARCHAR(100),
    "service_description" TEXT NOT NULL,
    "service_fee_cents" INTEGER NOT NULL,
    "payout_cents" INTEGER NOT NULL,
    "platform_cut_cents" INTEGER NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "admin_notes" TEXT,
    "dispute_reason" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "approved_by_user_id" UUID,
    "paid_at" TIMESTAMP(3),
    "payout_id" UUID,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "referral_payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barber_id" UUID NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "batch_ref" VARCHAR(120),
    "notes" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "referrals_referring_barber_id_idx" ON "referrals"("referring_barber_id");
CREATE INDEX IF NOT EXISTS "referrals_performing_barber_id_idx" ON "referrals"("performing_barber_id");
CREATE INDEX IF NOT EXISTS "referrals_status_idx" ON "referrals"("status");
CREATE INDEX IF NOT EXISTS "referrals_submitted_at_idx" ON "referrals"("submitted_at");
CREATE INDEX IF NOT EXISTS "referrals_payout_id_idx" ON "referrals"("payout_id");
CREATE INDEX IF NOT EXISTS "referral_payouts_barber_id_idx" ON "referral_payouts"("barber_id");
CREATE INDEX IF NOT EXISTS "referral_payouts_batch_ref_idx" ON "referral_payouts"("batch_ref");
CREATE INDEX IF NOT EXISTS "referral_payouts_paid_at_idx" ON "referral_payouts"("paid_at");

-- AddForeignKey (idempotent via DO blocks)
DO $$ BEGIN
  ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referring_barber_id_fkey" FOREIGN KEY ("referring_barber_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "referrals" ADD CONSTRAINT "referrals_performing_barber_id_fkey" FOREIGN KEY ("performing_barber_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "referrals" ADD CONSTRAINT "referrals_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "referral_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "referral_payouts" ADD CONSTRAINT "referral_payouts_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

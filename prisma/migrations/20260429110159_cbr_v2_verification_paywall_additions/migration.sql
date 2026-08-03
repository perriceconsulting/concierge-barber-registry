-- CBR v2.0 — FEAT-001 Verification Paywall additions
-- Additive only: no data loss possible.

-- AlterEnum: extend VerificationStatus with `expired` (license-renewal lifecycle)
ALTER TYPE "VerificationStatus" ADD VALUE 'expired';

-- AlterEnum: add `verified` tier alongside existing starter|professional|elite.
-- (The old tiers stay until the v2 cutover decision is finalized — PD-2.)
ALTER TYPE "SubscriptionTier" ADD VALUE 'verified';

-- AlterTable: one-time setup fee + Founding Member grandfathering fields
ALTER TABLE "barber_profiles"
  ADD COLUMN "setup_fee_paid_at" TIMESTAMP(3),
  ADD COLUMN "setup_fee_amount_cents" INTEGER,
  ADD COLUMN "setup_fee_stripe_pi_id" VARCHAR(255),
  ADD COLUMN "founding_member" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "subscription_waived_until" TIMESTAMP(3);

-- CreateIndex: ensure each Stripe payment intent maps to at most one barber
CREATE UNIQUE INDEX "barber_profiles_setup_fee_stripe_pi_id_key"
  ON "barber_profiles"("setup_fee_stripe_pi_id");

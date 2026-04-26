-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('unclaimed', 'claim_sent', 'claimed');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('self_signup', 'manual_admin', 'google_places', 'state_license');

-- AlterTable: User
ALTER TABLE "users" ADD COLUMN "is_stub" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: BarberProfile
ALTER TABLE "barber_profiles"
  ADD COLUMN "claim_status" "ClaimStatus" NOT NULL DEFAULT 'claimed',
  ADD COLUMN "data_source" "DataSource" NOT NULL DEFAULT 'self_signup',
  ADD COLUMN "claim_token" UUID,
  ADD COLUMN "claim_invitation_sent_at" TIMESTAMP(3),
  ADD COLUMN "claim_invitation_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "outreach_email" VARCHAR(255),
  ADD COLUMN "removal_requested_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "barber_profiles_claim_token_key" ON "barber_profiles"("claim_token");

-- CreateIndex
CREATE INDEX "barber_profiles_claim_status_idx" ON "barber_profiles"("claim_status");

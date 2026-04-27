-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM (
  'not_contacted',
  'messaged_ig',
  'messaged_fb',
  'messaged_tiktok',
  'messaged_email',
  'messaged_phone',
  'responded',
  'not_interested',
  'bounced'
);

-- AlterTable
ALTER TABLE "barber_profiles"
  ADD COLUMN "outreach_status" "OutreachStatus" NOT NULL DEFAULT 'not_contacted',
  ADD COLUMN "outreach_updated_at" TIMESTAMP(3),
  ADD COLUMN "outreach_notes" TEXT;

-- CreateIndex
CREATE INDEX "barber_profiles_outreach_status_idx" ON "barber_profiles"("outreach_status");

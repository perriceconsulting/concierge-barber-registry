-- CBR v2.0 — W7 HNWI role + Black Label lead capture
-- Additive only: no data loss possible.

-- AlterEnum: extend UserRole with `hnwi` (invite-only Black Label access)
ALTER TYPE "UserRole" ADD VALUE 'hnwi';

-- CreateEnum: status lifecycle for Black Label membership requests
CREATE TYPE "BlackLabelLeadStatus" AS ENUM ('new', 'contacted', 'converted', 'declined');

-- CreateTable: persisted Black Label membership requests (replaces the W2 stub
-- logger-only behavior on POST /api/black-label/request-access)
CREATE TABLE "black_label_leads" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "full_name" VARCHAR(120) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "city" VARCHAR(120),
  "source" VARCHAR(120),
  "notes" TEXT,
  "status" "BlackLabelLeadStatus" NOT NULL DEFAULT 'new',
  "admin_notes" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "reviewed_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "black_label_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "black_label_leads_status_idx" ON "black_label_leads"("status");
CREATE INDEX "black_label_leads_email_idx" ON "black_label_leads"("email");
CREATE INDEX "black_label_leads_created_at_idx" ON "black_label_leads"("created_at");

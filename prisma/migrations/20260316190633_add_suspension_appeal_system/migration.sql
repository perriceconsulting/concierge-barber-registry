-- CreateEnum
CREATE TYPE "SuspensionReason" AS ENUM ('fraudulent_documentation', 'expired_license', 'policy_violation', 'client_complaints', 'payment_fraud', 'legal_regulatory');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('pending', 'approved', 'denied');

-- AlterTable
ALTER TABLE "barber_profiles" ADD COLUMN     "suspended_at" TIMESTAMP(3),
ADD COLUMN     "suspended_by_user_id" UUID,
ADD COLUMN     "suspension_reason" "SuspensionReason";

-- CreateTable
CREATE TABLE "suspension_appeals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barber_profile_id" UUID NOT NULL,
    "reason" "SuspensionReason" NOT NULL,
    "appeal_text" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'pending',
    "admin_notes" TEXT,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suspension_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suspension_appeals_barber_profile_id_idx" ON "suspension_appeals"("barber_profile_id");

-- CreateIndex
CREATE INDEX "suspension_appeals_status_idx" ON "suspension_appeals"("status");

-- AddForeignKey
ALTER TABLE "barber_profiles" ADD CONSTRAINT "barber_profiles_suspended_by_user_id_fkey" FOREIGN KEY ("suspended_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspension_appeals" ADD CONSTRAINT "suspension_appeals_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspension_appeals" ADD CONSTRAINT "suspension_appeals_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

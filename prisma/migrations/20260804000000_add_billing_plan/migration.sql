-- CreateEnum
CREATE TYPE "BillingPlan" AS ENUM ('annual', 'monthly');
-- AlterTable
ALTER TABLE "barber_profiles" ADD COLUMN     "selected_plan" "BillingPlan" NOT NULL DEFAULT 'annual';

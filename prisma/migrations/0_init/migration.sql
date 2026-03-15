-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('barber', 'client', 'admin');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "ContactRequestStatus" AS ENUM ('new', 'read', 'responded', 'archived');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "role" "UserRole" NOT NULL DEFAULT 'client',
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notify_email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notify_contact_requests" BOOLEAN NOT NULL DEFAULT true,
    "notify_new_reviews" BOOLEAN NOT NULL DEFAULT true,
    "notify_marketing_emails" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(255) NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "bio" TEXT,
    "tagline" VARCHAR(255),
    "years_experience" INTEGER,
    "license_number" VARCHAR(100),
    "license_state" VARCHAR(2),
    "license_expiration_date" DATE,
    "license_document_url" TEXT,
    "license_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "verification_notes" TEXT,
    "verified_at" TIMESTAMP(3),
    "verified_by_user_id" UUID,
    "submitted_for_verification_at" TIMESTAMP(3),
    "shop_name" VARCHAR(200),
    "shop_address_line1" VARCHAR(255),
    "shop_address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "zip_code" VARCHAR(10) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "offers_mobile_service" BOOLEAN NOT NULL DEFAULT false,
    "mobile_service_radius_miles" INTEGER,
    "website_url" TEXT,
    "instagram_handle" VARCHAR(100),
    "tiktok_handle" VARCHAR(100),
    "accepts_walkins" BOOLEAN NOT NULL DEFAULT true,
    "accepts_appointments" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "average_rating" DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "profile_views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialties" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_specialties" (
    "barber_profile_id" UUID NOT NULL,
    "specialty_id" INTEGER NOT NULL,

    CONSTRAINT "barber_specialties_pkey" PRIMARY KEY ("barber_profile_id","specialty_id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barber_profile_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barber_profile_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "caption" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barber_profile_id" UUID NOT NULL,
    "client_user_id" UUID,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(200),
    "comment" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operating_hours" (
    "id" SERIAL NOT NULL,
    "barber_profile_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "open_time" TEXT,
    "close_time" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "client_user_id" UUID NOT NULL,
    "barber_profile_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("client_user_id","barber_profile_id")
);

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barber_profile_id" UUID NOT NULL,
    "client_user_id" UUID,
    "client_name" VARCHAR(200) NOT NULL,
    "client_email" VARCHAR(255) NOT NULL,
    "client_phone" VARCHAR(20),
    "message" TEXT NOT NULL,
    "service_interested" VARCHAR(200),
    "preferred_date" DATE,
    "preferred_time" TEXT,
    "status" "ContactRequestStatus" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_refresh_token_hash_idx" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_is_revoked_expires_at_idx" ON "sessions"("user_id", "is_revoked", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_user_id_idx" ON "verification_tokens"("user_id");

-- CreateIndex
CREATE INDEX "verification_tokens_token_idx" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_expires_at_idx" ON "verification_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "verification_tokens_user_id_type_expires_at_idx" ON "verification_tokens"("user_id", "type", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "barber_profiles_user_id_key" ON "barber_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "barber_profiles_slug_key" ON "barber_profiles"("slug");

-- CreateIndex
CREATE INDEX "barber_profiles_user_id_idx" ON "barber_profiles"("user_id");

-- CreateIndex
CREATE INDEX "barber_profiles_slug_idx" ON "barber_profiles"("slug");

-- CreateIndex
CREATE INDEX "barber_profiles_city_idx" ON "barber_profiles"("city");

-- CreateIndex
CREATE INDEX "barber_profiles_state_idx" ON "barber_profiles"("state");

-- CreateIndex
CREATE INDEX "barber_profiles_zip_code_idx" ON "barber_profiles"("zip_code");

-- CreateIndex
CREATE INDEX "barber_profiles_verification_status_idx" ON "barber_profiles"("verification_status");

-- CreateIndex
CREATE INDEX "barber_profiles_is_featured_idx" ON "barber_profiles"("is_featured");

-- CreateIndex
CREATE INDEX "barber_profiles_average_rating_idx" ON "barber_profiles"("average_rating");

-- CreateIndex
CREATE INDEX "barber_profiles_verification_status_average_rating_idx" ON "barber_profiles"("verification_status", "average_rating");

-- CreateIndex
CREATE INDEX "barber_profiles_verification_status_city_state_idx" ON "barber_profiles"("verification_status", "city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_name_key" ON "specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_slug_key" ON "specialties"("slug");

-- CreateIndex
CREATE INDEX "services_barber_profile_id_idx" ON "services"("barber_profile_id");

-- CreateIndex
CREATE INDEX "portfolio_images_barber_profile_id_idx" ON "portfolio_images"("barber_profile_id");

-- CreateIndex
CREATE INDEX "reviews_barber_profile_id_idx" ON "reviews"("barber_profile_id");

-- CreateIndex
CREATE INDEX "reviews_client_user_id_idx" ON "reviews"("client_user_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_barber_profile_id_is_visible_idx" ON "reviews"("barber_profile_id", "is_visible");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_barber_profile_id_client_user_id_key" ON "reviews"("barber_profile_id", "client_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "operating_hours_barber_profile_id_day_of_week_key" ON "operating_hours"("barber_profile_id", "day_of_week");

-- CreateIndex
CREATE INDEX "contact_requests_barber_profile_id_idx" ON "contact_requests"("barber_profile_id");

-- CreateIndex
CREATE INDEX "contact_requests_status_idx" ON "contact_requests"("status");

-- CreateIndex
CREATE INDEX "audit_log_actor_user_id_idx" ON "audit_log"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_idx" ON "audit_log"("entity_type");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_profiles" ADD CONSTRAINT "barber_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_profiles" ADD CONSTRAINT "barber_profiles_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_specialties" ADD CONSTRAINT "barber_specialties_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_specialties" ADD CONSTRAINT "barber_specialties_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_images" ADD CONSTRAINT "portfolio_images_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operating_hours" ADD CONSTRAINT "operating_hours_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


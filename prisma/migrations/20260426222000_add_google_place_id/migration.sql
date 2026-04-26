-- AlterTable: add Google Place ID for dedup of imported profiles
ALTER TABLE "barber_profiles"
  ADD COLUMN "google_place_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "barber_profiles_google_place_id_key" ON "barber_profiles"("google_place_id");

-- CreateTable
CREATE TABLE "body_measurements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "chest" DOUBLE PRECISION,
    "waist" DOUBLE PRECISION,
    "hips" DOUBLE PRECISION,
    "shoulders" DOUBLE PRECISION,
    "biceps" DOUBLE PRECISION,
    "forearms" DOUBLE PRECISION,
    "thighs" DOUBLE PRECISION,
    "calves" DOUBLE PRECISION,
    "neck" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "body_measurements_user_id_date_idx" ON "body_measurements"("user_id", "date");

-- AddForeignKey
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

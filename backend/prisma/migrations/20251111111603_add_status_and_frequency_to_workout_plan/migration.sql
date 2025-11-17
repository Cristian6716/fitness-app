-- AlterTable
ALTER TABLE "workout_plans" ADD COLUMN     "frequency" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

/*
  Warnings:

  - Added the required column `plan_id` to the `completed_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan_name` to the `completed_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_name` to the `completed_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `completed_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exercise_name` to the `completed_sets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "completed_sessions" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "plan_id" TEXT NOT NULL,
ADD COLUMN     "plan_name" TEXT NOT NULL,
ADD COLUMN     "session_name" TEXT NOT NULL,
ADD COLUMN     "total_reps" INTEGER,
ADD COLUMN     "total_sets" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "completed_at" DROP NOT NULL,
ALTER COLUMN "total_duration_seconds" DROP NOT NULL,
ALTER COLUMN "calories_burned" DROP NOT NULL,
ALTER COLUMN "total_weight_lifted" DROP NOT NULL;

-- AlterTable
ALTER TABLE "completed_sets" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "exercise_name" TEXT NOT NULL,
ALTER COLUMN "actual_weight" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "completed_sessions_user_id_completed_at_idx" ON "completed_sessions"("user_id", "completed_at");

-- CreateIndex
CREATE INDEX "completed_sessions_plan_id_completed_at_idx" ON "completed_sessions"("plan_id", "completed_at");

-- AddForeignKey
ALTER TABLE "completed_sessions" ADD CONSTRAINT "completed_sessions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

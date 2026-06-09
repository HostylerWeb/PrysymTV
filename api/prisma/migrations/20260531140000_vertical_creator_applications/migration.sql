-- CreateEnum
CREATE TYPE "VerticalCreatorStatus" AS ENUM ('none', 'pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "vertical_creator_status" "VerticalCreatorStatus" NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "vertical_creator_applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "portfolio_url" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vertical_creator_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vertical_creator_applications_user_id_key" ON "vertical_creator_applications"("user_id");

-- AddForeignKey
ALTER TABLE "vertical_creator_applications" ADD CONSTRAINT "vertical_creator_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vertical_creator_applications" ADD CONSTRAINT "vertical_creator_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

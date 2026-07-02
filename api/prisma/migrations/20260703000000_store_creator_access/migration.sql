-- CreateEnum
CREATE TYPE "StoreCreatorStatus" AS ENUM ('none', 'pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "store_creator_status" "StoreCreatorStatus" NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "store_creator_applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "id_document_url" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "review_notes" TEXT,
    "accepted_terms" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_creator_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_creator_applications_user_id_key" ON "store_creator_applications"("user_id");

-- AddForeignKey
ALTER TABLE "store_creator_applications" ADD CONSTRAINT "store_creator_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_creator_applications" ADD CONSTRAINT "store_creator_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable (product revenue default for new rows)
ALTER TABLE "store_products" ALTER COLUMN "revenue_rule_key" SET DEFAULT 'store_merchandise';

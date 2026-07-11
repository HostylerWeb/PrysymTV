-- CreateEnum
CREATE TYPE "StreamAccessType" AS ENUM ('free', 'paid');

-- AlterTable
ALTER TABLE "streams" ADD COLUMN "access_type" "StreamAccessType" NOT NULL DEFAULT 'free';
ALTER TABLE "streams" ADD COLUMN "entry_price_usd" DECIMAL(10,2);
ALTER TABLE "streams" ADD COLUMN "entry_coin_cost" INTEGER;

-- CreateTable
CREATE TABLE "stream_access" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stream_id" UUID NOT NULL,
    "coin_cost" INTEGER NOT NULL,
    "revenue_batch_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stream_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stream_access_stream_id_idx" ON "stream_access"("stream_id");

-- CreateIndex
CREATE UNIQUE INDEX "stream_access_user_id_stream_id_key" ON "stream_access"("user_id", "stream_id");

-- AddForeignKey
ALTER TABLE "stream_access" ADD CONSTRAINT "stream_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_access" ADD CONSTRAINT "stream_access_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_access" ADD CONSTRAINT "stream_access_revenue_batch_id_fkey" FOREIGN KEY ("revenue_batch_id") REFERENCES "revenue_ledger_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

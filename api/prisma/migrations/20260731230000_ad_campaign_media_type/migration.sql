-- CreateEnum
CREATE TYPE "AdMediaType" AS ENUM ('image', 'video');

-- AlterTable
ALTER TABLE "ad_campaigns" ADD COLUMN "media_type" "AdMediaType" NOT NULL DEFAULT 'image';

-- Backfill video campaigns from URL extension (best-effort for existing rows).
UPDATE "ad_campaigns"
SET "media_type" = 'video'
WHERE "media_url" ~* '\.(mp4|webm|mov|m4v|ogg|ogv|m3u8|avi|mkv)(\?|$)';

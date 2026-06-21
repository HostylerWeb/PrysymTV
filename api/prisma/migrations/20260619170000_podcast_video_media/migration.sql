-- CreateEnum
CREATE TYPE "PodcastMediaType" AS ENUM ('audio', 'video');

-- AlterTable
ALTER TABLE "podcast_episodes" ADD COLUMN "media_type" "PodcastMediaType" NOT NULL DEFAULT 'audio';
ALTER TABLE "podcast_episodes" ADD COLUMN "video_url" TEXT;

-- CreateEnum
CREATE TYPE "VerticalSeriesStatus" AS ENUM ('draft', 'published');

-- AlterEnum
ALTER TYPE "AdPlacement" ADD VALUE 'vertical_episode';

-- CreateTable
CREATE TABLE "vertical_series" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "poster_url" TEXT,
    "banner_url" TEXT,
    "genre" TEXT,
    "total_episodes" INTEGER NOT NULL DEFAULT 0,
    "status" "VerticalSeriesStatus" NOT NULL DEFAULT 'published',
    "creator_id" UUID,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vertical_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vertical_episodes" (
    "id" UUID NOT NULL,
    "series_id" UUID NOT NULL,
    "episode_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "video_url" TEXT,
    "duration_seconds" INTEGER NOT NULL DEFAULT 120,
    "cliffhanger" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'ready',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vertical_episodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vertical_series_slug_key" ON "vertical_series"("slug");

-- CreateIndex
CREATE INDEX "vertical_series_status_idx" ON "vertical_series"("status");

-- CreateIndex
CREATE INDEX "vertical_episodes_series_id_idx" ON "vertical_episodes"("series_id");

-- CreateIndex
CREATE UNIQUE INDEX "vertical_episodes_series_id_episode_number_key" ON "vertical_episodes"("series_id", "episode_number");

-- AddForeignKey
ALTER TABLE "vertical_series" ADD CONSTRAINT "vertical_series_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vertical_episodes" ADD CONSTRAINT "vertical_episodes_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "vertical_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Video dislikes counter
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "dislikes_count" INTEGER NOT NULL DEFAULT 0;

-- Dislike reactions (videos)
CREATE TYPE "DislikeTargetType" AS ENUM ('video');

CREATE TABLE "dislikes" (
    "user_id" UUID NOT NULL,
    "target_type" "DislikeTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dislikes_pkey" PRIMARY KEY ("user_id","target_type","target_id")
);

ALTER TABLE "dislikes" ADD CONSTRAINT "dislikes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Extend like/save/report enums
ALTER TYPE "LikeTargetType" ADD VALUE IF NOT EXISTS 'vertical_episode';
ALTER TYPE "SavedItemType" ADD VALUE IF NOT EXISTS 'vertical_episode';
ALTER TYPE "SavedItemType" ADD VALUE IF NOT EXISTS 'vertical_series';
ALTER TYPE "ReportTargetType" ADD VALUE IF NOT EXISTS 'podcast_episode';
ALTER TYPE "ReportTargetType" ADD VALUE IF NOT EXISTS 'vertical_episode';

-- Vertical episode engagement counters
ALTER TABLE "vertical_episodes" ADD COLUMN IF NOT EXISTS "views_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "vertical_episodes" ADD COLUMN IF NOT EXISTS "likes_count" INTEGER NOT NULL DEFAULT 0;

-- Per-creator live alert subscriptions (notify bell)
CREATE TABLE "creator_live_alerts" (
    "user_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_live_alerts_pkey" PRIMARY KEY ("user_id","creator_id")
);

ALTER TABLE "creator_live_alerts" ADD CONSTRAINT "creator_live_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "creator_live_alerts" ADD CONSTRAINT "creator_live_alerts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

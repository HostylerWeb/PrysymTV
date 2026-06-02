-- CreateEnum
CREATE TYPE "CreatorPartnerTier" AS ENUM ('standard', 'rising', 'partner', 'flagship');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "partner_tier" "CreatorPartnerTier" NOT NULL DEFAULT 'standard';

-- CreateTable
CREATE TABLE "content_ad_events" (
    "id" BIGSERIAL NOT NULL,
    "campaign_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "video_id" UUID,
    "placement" "AdPlacement" NOT NULL,
    "event_type" "AnalyticsEventType" NOT NULL,
    "viewer_user_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_ad_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_program_verticals" (
    "user_id" UUID NOT NULL,
    "vertical" "ContentVertical" NOT NULL,

    CONSTRAINT "creator_program_verticals_pkey" PRIMARY KEY ("user_id","vertical")
);

-- CreateIndex
CREATE INDEX "content_ad_events_creator_id_created_at_idx" ON "content_ad_events"("creator_id", "created_at");

-- CreateIndex
CREATE INDEX "content_ad_events_video_id_event_type_idx" ON "content_ad_events"("video_id", "event_type");

-- CreateIndex
CREATE INDEX "content_ad_events_campaign_id_created_at_idx" ON "content_ad_events"("campaign_id", "created_at");

-- AddForeignKey
ALTER TABLE "content_ad_events" ADD CONSTRAINT "content_ad_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_ad_events" ADD CONSTRAINT "content_ad_events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_ad_events" ADD CONSTRAINT "content_ad_events_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_program_verticals" ADD CONSTRAINT "creator_program_verticals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

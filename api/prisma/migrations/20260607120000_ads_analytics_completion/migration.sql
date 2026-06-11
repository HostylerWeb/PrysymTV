-- User geography for analytics
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country_code" VARCHAR(2);

-- Share counts on videos
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "shares_count" INTEGER NOT NULL DEFAULT 0;

-- Dislikes on podcast / vertical episodes
ALTER TABLE "podcast_episodes" ADD COLUMN IF NOT EXISTS "dislikes_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "vertical_episodes" ADD COLUMN IF NOT EXISTS "dislikes_count" INTEGER NOT NULL DEFAULT 0;

-- Extend dislike targets
ALTER TYPE "DislikeTargetType" ADD VALUE IF NOT EXISTS 'podcast_episode';
ALTER TYPE "DislikeTargetType" ADD VALUE IF NOT EXISTS 'vertical_episode';

-- Admin audit log
CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "admin_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_audit_logs_admin_id_created_at_idx" ON "admin_audit_logs"("admin_id", "created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_entity_type_created_at_idx" ON "admin_audit_logs"("entity_type", "created_at");

ALTER TABLE "admin_audit_logs" DROP CONSTRAINT IF EXISTS "admin_audit_logs_admin_id_fkey";
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

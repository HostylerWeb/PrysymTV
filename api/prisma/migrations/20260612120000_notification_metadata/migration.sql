-- Add JSON metadata for notification deep links and dedupe keys.
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Persist upload object key for complete/processing after API restart
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "raw_object_key" TEXT;

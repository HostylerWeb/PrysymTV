-- Store product gallery images + unlimited inventory flag
ALTER TABLE "store_products" ADD COLUMN IF NOT EXISTS "gallery_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "store_products" ADD COLUMN IF NOT EXISTS "inventory_unlimited" BOOLEAN NOT NULL DEFAULT false;

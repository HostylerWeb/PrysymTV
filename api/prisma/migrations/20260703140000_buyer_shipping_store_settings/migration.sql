-- Buyer checkout details on users
ALTER TABLE "users" ADD COLUMN "buyer_full_name" TEXT;
ALTER TABLE "users" ADD COLUMN "buyer_phone" TEXT;
ALTER TABLE "users" ADD COLUMN "buyer_address_line1" TEXT;
ALTER TABLE "users" ADD COLUMN "buyer_address_line2" TEXT;
ALTER TABLE "users" ADD COLUMN "buyer_city" TEXT;
ALTER TABLE "users" ADD COLUMN "buyer_state" TEXT;
ALTER TABLE "users" ADD COLUMN "buyer_postal_code" TEXT;
ALTER TABLE "users" ADD COLUMN "buyer_country_code" VARCHAR(2);

-- Store shipping settings
ALTER TABLE "creator_stores" ADD COLUMN "shipping_free" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "creator_stores" ADD COLUMN "shipping_fee_usd" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Order shipping snapshot
ALTER TABLE "store_orders" ADD COLUMN "shipping_fee_usd" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "store_orders" ADD COLUMN "shipping_snapshot" JSONB;

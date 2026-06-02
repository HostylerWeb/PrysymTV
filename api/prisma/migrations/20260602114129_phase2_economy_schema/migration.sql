-- CreateEnum
CREATE TYPE "ContentVertical" AS ENUM ('general', 'podcast', 'sports', 'concert', 'community_event', 'education');

-- CreateEnum
CREATE TYPE "LiveEventType" AS ENUM ('sports', 'concert', 'community', 'education', 'general');

-- CreateEnum
CREATE TYPE "LiveEventStatus" AS ENUM ('scheduled', 'live', 'ended', 'cancelled');

-- CreateEnum
CREATE TYPE "RevenueParty" AS ENUM ('creator', 'platform', 'gaf', 'creator_dev_fund');

-- CreateEnum
CREATE TYPE "RevenueSourceType" AS ENUM ('gift', 'tip', 'donation', 'super_chat', 'ticket', 'store_order', 'creator_subscription', 'platform_subscription', 'ad_impression', 'sponsorship', 'insider_membership', 'coin_purchase', 'payout');

-- CreateEnum
CREATE TYPE "GafLedgerDirection" AS ENUM ('inflow', 'outflow');

-- CreateEnum
CREATE TYPE "GafFundingSource" AS ENUM ('advertising', 'sponsorship', 'marketplace', 'membership', 'grant', 'donation', 'allocation', 'viewer_support');

-- CreateEnum
CREATE TYPE "GafProgramCategory" AS ENUM ('economic', 'workforce', 'housing', 'youth');

-- CreateEnum
CREATE TYPE "ViewerSupportType" AS ENUM ('tip', 'donation', 'super_chat', 'gift');

-- CreateEnum
CREATE TYPE "ViewerSupportStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "StoreProductType" AS ENUM ('merchandise', 'ticket', 'course', 'digital');

-- CreateEnum
CREATE TYPE "StoreProductStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "StoreOrderStatus" AS ENUM ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "SponsorshipDealStatus" AS ENUM ('draft', 'proposed', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "InsiderSubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'past_due');

-- CreateEnum
CREATE TYPE "FraudSignalType" AS ENUM ('suspicious_views', 'gift_velocity', 'chargeback_risk', 'bot_traffic');

-- CreateEnum
CREATE TYPE "FraudSignalStatus" AS ENUM ('open', 'reviewed', 'dismissed', 'actioned');

-- CreateEnum
CREATE TYPE "TaxDocumentStatus" AS ENUM ('not_submitted', 'pending_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ImpactReportStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "CreatorBalanceEntryType" AS ENUM ('credit', 'debit');

-- AlterTable
ALTER TABLE "ad_campaigns" ADD COLUMN     "advertiser_account_id" UUID,
ADD COLUMN     "revenue_rule_key" TEXT NOT NULL DEFAULT 'ad_gaf_allocation';

-- AlterTable
ALTER TABLE "gifts" ADD COLUMN     "revenue_batch_id" UUID;

-- AlterTable
ALTER TABLE "podcast_shows" ADD COLUMN     "vertical" "ContentVertical" DEFAULT 'podcast';

-- AlterTable
ALTER TABLE "streams" ADD COLUMN     "vertical" "ContentVertical";

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "vertical" "ContentVertical";

-- CreateTable
CREATE TABLE "revenue_split_rules" (
    "rule_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creator_bps" INTEGER NOT NULL DEFAULT 0,
    "platform_bps" INTEGER NOT NULL,
    "gaf_bps" INTEGER NOT NULL DEFAULT 0,
    "creator_dev_fund_bps" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "revenue_split_rules_pkey" PRIMARY KEY ("rule_key")
);

-- CreateTable
CREATE TABLE "revenue_ledger_batches" (
    "id" UUID NOT NULL,
    "rule_key" TEXT NOT NULL,
    "source_type" "RevenueSourceType" NOT NULL,
    "source_id" UUID NOT NULL,
    "gross_amount_usd" DECIMAL(12,4) NOT NULL,
    "creator_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_ledger_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_ledger_entries" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "party" "RevenueParty" NOT NULL,
    "amount_usd" DECIMAL(12,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gaf_ledger_entries" (
    "id" UUID NOT NULL,
    "direction" "GafLedgerDirection" NOT NULL,
    "source" "GafFundingSource" NOT NULL,
    "amount_usd" DECIMAL(12,4) NOT NULL,
    "program_category" "GafProgramCategory",
    "reference_id" UUID,
    "revenue_batch_id" UUID,
    "gaf_program_id" UUID,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gaf_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gaf_programs" (
    "id" UUID NOT NULL,
    "category" "GafProgramCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gaf_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewer_support_transactions" (
    "id" UUID NOT NULL,
    "type" "ViewerSupportType" NOT NULL,
    "status" "ViewerSupportStatus" NOT NULL DEFAULT 'pending',
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "stream_id" UUID,
    "video_id" UUID,
    "gift_id" UUID,
    "amount_usd" DECIMAL(12,4),
    "coin_value" INTEGER,
    "message" TEXT,
    "revenue_batch_id" UUID,
    "provider_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viewer_support_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_events" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "stream_id" UUID,
    "event_type" "LiveEventType" NOT NULL,
    "vertical" "ContentVertical" NOT NULL DEFAULT 'general',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "venue" TEXT,
    "geo" JSONB,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "ticket_product_id" UUID,
    "status" "LiveEventStatus" NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_stores" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "banner_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_products" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "product_type" "StoreProductType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price_usd" DECIMAL(12,2) NOT NULL,
    "image_url" TEXT,
    "digital_url" TEXT,
    "inventory" INTEGER,
    "status" "StoreProductStatus" NOT NULL DEFAULT 'draft',
    "revenue_rule_key" TEXT NOT NULL DEFAULT 'live_event',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_orders" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "status" "StoreOrderStatus" NOT NULL DEFAULT 'pending',
    "total_usd" DECIMAL(12,2) NOT NULL,
    "revenue_batch_id" UUID,
    "provider_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_order_lines" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_usd" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "store_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_insider_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stripe_subscription_id" TEXT,
    "status" "InsiderSubscriptionStatus" NOT NULL DEFAULT 'active',
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "revenue_rule_key" TEXT NOT NULL DEFAULT 'insider_membership',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_insider_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsorship_deals" (
    "id" UUID NOT NULL,
    "brand_user_id" UUID,
    "brand_name" TEXT NOT NULL,
    "creator_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "amount_usd" DECIMAL(12,2) NOT NULL,
    "deliverables" JSONB,
    "status" "SponsorshipDealStatus" NOT NULL DEFAULT 'draft',
    "revenue_rule_key" TEXT NOT NULL DEFAULT 'sponsorship',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsorship_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_impact_snapshots" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "period_month" DATE NOT NULL,
    "earnings_usd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ad_revenue_usd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sponsorship_revenue_usd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "merchandise_revenue_usd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "donations_usd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "watch_hours" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "retention_rate" DECIMAL(5,4),
    "subscriber_count" INTEGER NOT NULL DEFAULT 0,
    "engagement_score" DECIMAL(10,2),
    "jobs_supported" INTEGER NOT NULL DEFAULT 0,
    "businesses_funded" INTEGER NOT NULL DEFAULT 0,
    "dollars_invested" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "workforce_opportunities" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_impact_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_balance_ledger" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "entry_type" "CreatorBalanceEntryType" NOT NULL,
    "amount_usd" DECIMAL(12,4) NOT NULL,
    "batch_id" UUID,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_balance_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_tax_profiles" (
    "user_id" UUID NOT NULL,
    "legal_name" TEXT,
    "tax_id_encrypted" TEXT,
    "address_json" JSONB,
    "document_status" "TaxDocumentStatus" NOT NULL DEFAULT 'not_submitted',
    "w9_submitted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_tax_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "advertiser_accounts" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID,
    "company_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "billing_email" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advertiser_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_impact_reports" (
    "id" UUID NOT NULL,
    "advertiser_account_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "businesses_supported" INTEGER NOT NULL DEFAULT 0,
    "jobs_supported" INTEGER NOT NULL DEFAULT 0,
    "economic_impact_usd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "report_data" JSONB,
    "status" "ImpactReportStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_impact_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_signals" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "signal_type" "FraudSignalType" NOT NULL,
    "status" "FraudSignalStatus" NOT NULL DEFAULT 'open',
    "score" DECIMAL(5,4),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "fraud_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_announcements" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'insider',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "revenue_ledger_batches_source_type_source_id_idx" ON "revenue_ledger_batches"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "revenue_ledger_batches_creator_id_created_at_idx" ON "revenue_ledger_batches"("creator_id", "created_at");

-- CreateIndex
CREATE INDEX "revenue_ledger_entries_batch_id_idx" ON "revenue_ledger_entries"("batch_id");

-- CreateIndex
CREATE INDEX "revenue_ledger_entries_party_created_at_idx" ON "revenue_ledger_entries"("party", "created_at");

-- CreateIndex
CREATE INDEX "gaf_ledger_entries_direction_created_at_idx" ON "gaf_ledger_entries"("direction", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "viewer_support_transactions_gift_id_key" ON "viewer_support_transactions"("gift_id");

-- CreateIndex
CREATE UNIQUE INDEX "viewer_support_transactions_revenue_batch_id_key" ON "viewer_support_transactions"("revenue_batch_id");

-- CreateIndex
CREATE INDEX "viewer_support_transactions_receiver_id_created_at_idx" ON "viewer_support_transactions"("receiver_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "live_events_stream_id_key" ON "live_events"("stream_id");

-- CreateIndex
CREATE INDEX "live_events_event_type_status_starts_at_idx" ON "live_events"("event_type", "status", "starts_at");

-- CreateIndex
CREATE INDEX "live_events_creator_id_idx" ON "live_events"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_stores_creator_id_key" ON "creator_stores"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_stores_slug_key" ON "creator_stores"("slug");

-- CreateIndex
CREATE INDEX "store_products_store_id_status_idx" ON "store_products"("store_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "store_orders_revenue_batch_id_key" ON "store_orders"("revenue_batch_id");

-- CreateIndex
CREATE INDEX "store_orders_buyer_id_idx" ON "store_orders"("buyer_id");

-- CreateIndex
CREATE INDEX "store_order_lines_order_id_idx" ON "store_order_lines"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_insider_subscriptions_user_id_key" ON "platform_insider_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_insider_subscriptions_stripe_subscription_id_key" ON "platform_insider_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "sponsorship_deals_creator_id_status_idx" ON "sponsorship_deals"("creator_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "creator_impact_snapshots_creator_id_period_month_key" ON "creator_impact_snapshots"("creator_id", "period_month");

-- CreateIndex
CREATE INDEX "creator_balance_ledger_creator_id_created_at_idx" ON "creator_balance_ledger"("creator_id", "created_at");

-- CreateIndex
CREATE INDEX "community_impact_reports_advertiser_account_id_period_start_idx" ON "community_impact_reports"("advertiser_account_id", "period_start");

-- CreateIndex
CREATE INDEX "fraud_signals_status_created_at_idx" ON "fraud_signals"("status", "created_at");

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_revenue_batch_id_fkey" FOREIGN KEY ("revenue_batch_id") REFERENCES "revenue_ledger_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_advertiser_account_id_fkey" FOREIGN KEY ("advertiser_account_id") REFERENCES "advertiser_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_split_rules" ADD CONSTRAINT "revenue_split_rules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_ledger_batches" ADD CONSTRAINT "revenue_ledger_batches_rule_key_fkey" FOREIGN KEY ("rule_key") REFERENCES "revenue_split_rules"("rule_key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_ledger_entries" ADD CONSTRAINT "revenue_ledger_entries_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "revenue_ledger_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gaf_ledger_entries" ADD CONSTRAINT "gaf_ledger_entries_revenue_batch_id_fkey" FOREIGN KEY ("revenue_batch_id") REFERENCES "revenue_ledger_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gaf_ledger_entries" ADD CONSTRAINT "gaf_ledger_entries_gaf_program_id_fkey" FOREIGN KEY ("gaf_program_id") REFERENCES "gaf_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_support_transactions" ADD CONSTRAINT "viewer_support_transactions_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_support_transactions" ADD CONSTRAINT "viewer_support_transactions_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_support_transactions" ADD CONSTRAINT "viewer_support_transactions_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_support_transactions" ADD CONSTRAINT "viewer_support_transactions_revenue_batch_id_fkey" FOREIGN KEY ("revenue_batch_id") REFERENCES "revenue_ledger_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_events" ADD CONSTRAINT "live_events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_events" ADD CONSTRAINT "live_events_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_events" ADD CONSTRAINT "live_events_ticket_product_id_fkey" FOREIGN KEY ("ticket_product_id") REFERENCES "store_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_stores" ADD CONSTRAINT "creator_stores_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "creator_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "creator_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_revenue_batch_id_fkey" FOREIGN KEY ("revenue_batch_id") REFERENCES "revenue_ledger_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_lines" ADD CONSTRAINT "store_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "store_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_lines" ADD CONSTRAINT "store_order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "store_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_insider_subscriptions" ADD CONSTRAINT "platform_insider_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorship_deals" ADD CONSTRAINT "sponsorship_deals_brand_user_id_fkey" FOREIGN KEY ("brand_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorship_deals" ADD CONSTRAINT "sponsorship_deals_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_impact_snapshots" ADD CONSTRAINT "creator_impact_snapshots_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_balance_ledger" ADD CONSTRAINT "creator_balance_ledger_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_tax_profiles" ADD CONSTRAINT "creator_tax_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertiser_accounts" ADD CONSTRAINT "advertiser_accounts_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_impact_reports" ADD CONSTRAINT "community_impact_reports_advertiser_account_id_fkey" FOREIGN KEY ("advertiser_account_id") REFERENCES "advertiser_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_signals" ADD CONSTRAINT "fraud_signals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

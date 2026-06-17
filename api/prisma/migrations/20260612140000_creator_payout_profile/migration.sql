-- Creator payout destination (saved payment method for withdrawals)
CREATE TABLE "creator_payout_profiles" (
    "user_id" UUID NOT NULL,
    "method" "PayoutMethod" NOT NULL,
    "details_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_payout_profiles_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "creator_payout_profiles" ADD CONSTRAINT "creator_payout_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_payouts" ADD COLUMN "payout_details_json" JSONB;

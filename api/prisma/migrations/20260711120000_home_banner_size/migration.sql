CREATE TYPE "home_banner_size" AS ENUM ('strip', 'standard', 'hero');

ALTER TABLE "ad_campaigns" ADD COLUMN "banner_size" "home_banner_size";

# Master Backend Development Plan: 0 to 100%

This document serves as the ultimate blueprint and checklist for building the **Prysym TV** backend. It details the architecture, database schema, API endpoints, and a week-by-week implementation checklist. The Next.js frontend (`/app`) is **UI-complete** and largely wired to the API (home, movies, shorts, podcasts, verticals, live, profile, settings). Engagement parity is complete (**§14.5**). Next up: **Admin UI** (§14.6), then production deploy. Canonical API routes: [`api.md`](./api.md).

**Stakeholder / mission requirements (Onyx Repository Foundation):** See [`stakeholder-product-requirements.md`](../web/stakeholder-product-requirements.md for content verticals (Sports, Concerts, Community Events, Education), **GAF**, revenue splits (80/15/5 live events, 90/5/5 viewer support), Creator Store™, Impact Dashboard™, Insider Membership, and **14 implementation modules**. That doc is the gap analysis; Section **15** below integrates it into this roadmap.

**Repository:** [github.com/HostylerWeb/PrysymTV](https://github.com/HostylerWeb/PrysymTV)

---

## 1. TECHNOLOGY STACK

- **Framework:** NestJS (TypeScript) - API-first, modular monolith
- **Database (Primary):** PostgreSQL (Neon or Supabase)
- **Database (Cache/Queues/Realtime):** Redis
- **Search Engine:** Typesense
- **Storage:** Cloudflare R2 (S3 compatible, zero egress fees)
- **CDN:** Cloudflare (for HLS video delivery, images, WAF)
- **Video Uploads:** TUS Protocol (Resumable uploads directly to R2)
- **Video Encoding:** FFmpeg (Background workers)
- **Live Streaming:** MediaMTX (RTMP ingest, LL-HLS generation)
- **Realtime Chat:** Socket.IO
- **Job Queues:** BullMQ
- **Payments/Billing:** Stripe (Web), Apple IAP / Google Play Billing (Mobile)

---

## 2. DATABASE SCHEMA (PostgreSQL)

### `users`
- `id` (UUID, PK)
- `username` (String, Unique)
- `email` (String, Unique)
- `password_hash` (String)
- `avatar_url` (String)
- `banner_url` (String) — Creator channel banner (`/banners/{user_id}.jpg`)
- `bio` (Text)
- `role` (Enum: 'user', 'creator', 'admin') — Required for admin panel guards
- `is_verified` (Boolean)
- `is_banned` (Boolean, default false)
- `streamer_status` (Enum: 'none', 'pending', 'approved', 'rejected')
- `coins_balance` (Integer)
- `premium_tier` (Enum: 'none', 'basic', 'premium', 'ultimate', nullable)
- `premium_expires_at` (Timestamp, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### `streamer_applications`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id, Unique)
- `description` (Text)
- `id_document_url` (String) — R2 path to uploaded ID photo
- `status` (Enum: 'pending', 'approved', 'rejected')
- `reviewed_by` (UUID, FK -> users.id, Nullable)
- `review_notes` (Text, Nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### `user_social_links`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `label` (String) — e.g. Website, Twitter
- `url` (String)
- `sort_order` (Integer)

### `user_notification_preferences`
- `user_id` (UUID, FK -> users.id)
- `type` (Enum: 'follow', 'like', 'comment', 'gift', 'live', 'upload', 'system')
- `enabled` (Boolean, default true)
- PK: (`user_id`, `type`)

### `gift_catalog` (Platform-configured gifts — must match frontend)
- `id` (String, PK) — heart, star, fire, diamond, lion, universe
- `name` (String)
- `coin_cost` (Integer)
- `animation_key` (String)
- `is_active` (Boolean)

### `content_verticals` (Stakeholder catalog pillars — optional FK on videos/streams/events)
- Values: `general`, `podcast`, `sports`, `concert`, `community_event`, `education`
- Used for home navigation, feeds, and advertiser targeting. See Section 15.

### `live_events` (Sports, Concerts, Community, Education — Phase 2)
- `id` (UUID, PK)
- `creator_id` (UUID, FK -> users.id)
- `stream_id` (UUID, FK -> streams.id, Nullable) — linked live broadcast
- `event_type` (Enum: 'sports', 'concert', 'community', 'education', 'general')
- `title`, `description`, `thumbnail_url`, `venue`, `geo` (JSONB: city, region, country)
- `starts_at`, `ends_at`, `ticket_product_id` (UUID, FK -> store_products.id, Nullable)
- `status` (Enum: 'scheduled', 'live', 'ended', 'cancelled')
- Revenue on ticket/PPV uses **80% creator / 15% PRYSYM / 5% GAF** (configurable via `revenue_split_rules`)

### `videos` (Shorts, Long-form & Movies)
- `id` (UUID, PK)
- `creator_id` (UUID, FK -> users.id)
- `type` (Enum: 'short', 'video', 'movie', 'series_episode')
- `vertical` (Enum, Nullable) — `sports`, `concert`, `community_event`, `education` when applicable
- `title` (String)
- `description` (Text)
- `category` (String) — Genre or category (e.g., Action, Comedy)
- `tags` (Array of Strings)
- `thumbnail_url` (String)
- `hls_master_url` (String)
- `duration_seconds` (Integer)
- `release_year` (Integer, Nullable) — Movies
- `age_rating` (String, Nullable) — PG-13, R, etc.
- `tagline` (String, Nullable)
- `director` (String, Nullable)
- `writers` (Array of Strings, Nullable)
- `visibility` (Enum: 'public', 'private', 'unlisted', 'subscriber_only')
- `status` (Enum: 'processing', 'ready', 'failed')
- `views_count` (Integer)
- `likes_count` (Integer)
- `comments_count` (Integer)
- `created_at` (Timestamp)

### `video_cast`
- `id` (UUID, PK)
- `video_id` (UUID, FK -> videos.id)
- `name` (String)
- `role` (String)
- `image_url` (String, Nullable)
- `sort_order` (Integer)

### `podcast_shows`
- `id` (UUID, PK)
- `creator_id` (UUID, FK -> users.id)
- `title` (String)
- `description` (Text)
- `cover_url` (String)
- `category` (String)
- `followers_count` (Integer)
- `visibility` (Enum: 'public', 'private', 'unlisted')
- `created_at` (Timestamp)

### `podcast_episodes`
- `id` (UUID, PK)
- `show_id` (UUID, FK -> podcast_shows.id)
- `creator_id` (UUID, FK -> users.id)
- `title` (String)
- `description` (Text)
- `cover_url` (String, Nullable)
- `audio_url` (String) — HLS or processed audio URL in R2
- `duration_seconds` (Integer)
- `visibility` (Enum: 'public', 'private', 'unlisted')
- `status` (Enum: 'processing', 'ready', 'failed')
- `plays_count` (Integer)
- `likes_count` (Integer)
- `published_at` (Timestamp)
- `created_at` (Timestamp)

### `podcasts` (DEPRECATED — use podcast_shows + podcast_episodes)
- Kept for migration only. New code should use the split model above.

### `streams` (Livestreams)
- `id` (UUID, PK)
- `creator_id` (UUID, FK -> users.id)
- `title` (String)
- `category` (String)
- `status` (Enum: 'scheduled', 'live', 'ended')
- `thumbnail_url` (String, Nullable)
- `hls_playback_url` (String, Nullable) — LL-HLS output from MediaMTX
- `viewer_count` (Integer)
- `temporary_stream_token` (String, nullable)
- `scheduled_at` (Timestamp, Nullable)
- `started_at` (Timestamp, nullable)
- `ended_at` (Timestamp, nullable)

### `follows`
- `follower_id` (UUID, FK -> users.id)
- `following_id` (UUID, FK -> users.id)
- `created_at` (Timestamp)

### `comments`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `video_id` (UUID, FK -> videos.id)
- `parent_id` (UUID, FK -> comments.id, Nullable for replies)
- `body` (Text)
- `likes_count` (Integer)
- `created_at` (Timestamp)

### `gifts`
- `id` (UUID, PK)
- `sender_id` (UUID, FK -> users.id)
- `receiver_id` (UUID, FK -> users.id)
- `stream_id` (UUID, FK -> streams.id, Nullable)
- `video_id` (UUID, FK -> videos.id, Nullable)
- `gift_type` (String)
- `coin_value` (Integer)
- `created_at` (Timestamp)

### `transactions` (Billing & Coins)
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `type` (Enum: 'purchase_coins', 'subscription', 'payout')
- `provider` (Enum: 'stripe', 'apple', 'google')
- `provider_transaction_id` (String)
- `amount_usd` (Decimal)
- `coins_added` (Integer)
- `status` (Enum: 'pending', 'completed', 'failed', 'refunded')
- `created_at` (Timestamp)

### `subscriptions` (Creator Subscriptions)
- `id` (UUID, PK)
- `subscriber_id` (UUID, FK -> users.id)
- `creator_id` (UUID, FK -> users.id)
- `stripe_subscription_id` (String)
- `tier` (Enum: 'basic', 'premium')
- `status` (Enum: 'active', 'cancelled', 'expired')
- `current_period_end` (Timestamp)
- `created_at` (Timestamp)

### `password_resets`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `token_hash` (String) — hashed reset token
- `expires_at` (Timestamp) — 15 minute TTL
- `used` (Boolean)
- `created_at` (Timestamp)

### `playlists`
- `id` (UUID, PK)
- `creator_id` (UUID, FK -> users.id)
- `title` (String)
- `description` (Text, Nullable)
- `cover_url` (String, Nullable)
- `type` (Enum: 'video', 'podcast', 'mixed')
- `visibility` (Enum: 'public', 'private', 'unlisted')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### `playlist_items`
- `id` (UUID, PK)
- `playlist_id` (UUID, FK -> playlists.id)
- `item_type` (Enum: 'video', 'podcast')
- `item_id` (UUID) — FK to either videos.id or podcasts.id
- `sort_order` (Integer)
- `added_at` (Timestamp)

### `stream_messages` (VOD Chat Replays)
- `id` (UUID, PK)
- `stream_id` (UUID, FK -> streams.id)
- `user_id` (UUID, FK -> users.id)
- `message` (Text)
- `timestamp_offset_ms` (Integer) — Milliseconds from stream start (for VOD sync)
- `created_at` (Timestamp)

### `watch_history` (Resume Playback & Recommendations)
- `user_id` (UUID, FK -> users.id)
- `content_type` (Enum: 'video', 'podcast')
- `content_id` (UUID)
- `progress_seconds` (Integer) — Where the user left off
- `completed` (Boolean)
- `updated_at` (Timestamp)
- PK: (`user_id`, `content_type`, `content_id`)

### `likes`
- `user_id` (UUID, FK -> users.id)
- `target_type` (Enum: 'video', 'podcast_episode', 'comment')
- `target_id` (UUID)
- `created_at` (Timestamp)
- PK: (`user_id`, `target_type`, `target_id`)

### `saved_items` (User Watchlist — replaces video-only saved_videos)
- `user_id` (UUID, FK -> users.id)
- `item_type` (Enum: 'video', 'movie', 'podcast_episode', 'live', 'playlist')
- `item_id` (UUID)
- `created_at` (Timestamp)
- PK: (`user_id`, `item_type`, `item_id`)

### `saved_videos` (Legacy — migrate to saved_items)

### `notifications`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `type` (Enum: 'follow', 'like', 'comment', 'gift', 'live', 'upload', 'system')
- `actor_id` (UUID, FK -> users.id, Nullable)
- `reference_id` (UUID) — video_id, stream_id, etc.
- `message` (String)
- `is_read` (Boolean)
- `created_at` (Timestamp)

### `reports` (Content Moderation)
- `id` (UUID, PK)
- `reporter_id` (UUID, FK -> users.id)
- `target_type` (Enum: 'video', 'comment', 'stream', 'user')
- `target_id` (UUID)
- `reason` (Enum: 'spam', 'nudity', 'violence', 'harassment', 'other')
- `description` (Text, Nullable)
- `status` (Enum: 'pending', 'reviewed', 'actioned', 'dismissed')
- `reviewed_by` (UUID, FK -> users.id, Nullable)
- `created_at` (Timestamp)

### `ad_campaigns` (Private Advertising)
- `id` (UUID, PK)
- `advertiser_name` (String)
- `title` (String)
- `media_url` (String) — banner image or video ad URL
- `click_through_url` (String)
- `placement` (Enum: 'home_banner', 'shorts_interstitial', 'movie_preroll')
- `target_impressions` (Integer)
- `delivered_impressions` (Integer, default 0)
- `clicks` (Integer, default 0)
- `budget_usd` (Decimal)
- `status` (Enum: 'draft', 'active', 'paused', 'completed')
- `starts_at` (Timestamp)
- `ends_at` (Timestamp)
- `created_at` (Timestamp)

### `analytics_events` (High-Volume Tracking)
- `id` (BigInt, PK, auto-increment)
- `event_type` (Enum: 'view', 'ad_impression', 'ad_click', 'watch_time', 'share')
- `user_id` (UUID, Nullable)
- `target_id` (UUID) — video_id, stream_id, or ad_campaign_id
- `metadata` (JSONB) — flexible extra data (duration_watched, device, country)
- `created_at` (Timestamp)

### `creator_payouts`
- `id` (UUID, PK)
- `creator_id` (UUID, FK -> users.id)
- `amount_usd` (Decimal)
- `method` (Enum: 'paypal', 'bank_transfer', 'crypto')
- `status` (Enum: 'requested', 'processing', 'completed', 'rejected')
- `processed_by` (UUID, FK -> users.id, Nullable) — admin who approved
- `created_at` (Timestamp)

### `revenue_split_rules` (Phase 2 — never hardcode percentages in code)
- `id` (UUID, PK)
- `rule_key` (String, Unique) — e.g. `live_event`, `viewer_support`, `insider_membership`, `ad_gaf_allocation`
- `creator_bps`, `platform_bps`, `gaf_bps`, `creator_dev_fund_bps` (Integer, basis points; sum = 10000)
- `effective_from`, `effective_to` (Timestamp)
- Stakeholder defaults: live_event **8000/1500/500**; viewer_support **9000/500/500**; insider **8000/1000/1000** (platform / GAF / creator dev fund)

### `revenue_ledger` (Phase 2 — immutable double-entry style lines)
- `id` (UUID, PK)
- `source_type` (Enum: 'gift', 'tip', 'donation', 'super_chat', 'ticket', 'store_order', 'subscription', 'ad', 'sponsorship', 'insider_membership')
- `source_id` (UUID)
- `party` (Enum: 'creator', 'platform', 'gaf', 'creator_dev_fund')
- `amount_usd` (Decimal)
- `creator_id` (UUID, Nullable)
- `created_at` (Timestamp)

### `gaf_ledger` (Phase 2 — Module 9)
- `id` (UUID, PK)
- `direction` (Enum: 'inflow', 'outflow')
- `source` (Enum: 'advertising', 'sponsorship', 'marketplace', 'membership', 'grant', 'donation', 'allocation')
- `amount_usd` (Decimal)
- `reference_id` (UUID, Nullable)
- `program_category` (Enum: 'economic', 'workforce', 'housing', 'youth', Nullable)
- `created_at` (Timestamp)

### `viewer_support_transactions` (Phase 2 — Module 6)
- `id` (UUID, PK)
- `type` (Enum: 'tip', 'donation', 'super_chat', 'gift')
- `sender_id`, `receiver_id` (UUID, FK -> users.id)
- `stream_id`, `video_id` (Nullable)
- `amount_usd` (Decimal, Nullable) — fiat tips/donations/super chat
- `coin_value` (Integer, Nullable) — gifts
- `message` (Text, Nullable) — super chat highlight text
- `ledger_id` (UUID, FK -> revenue_ledger aggregate, Nullable)

### `creator_stores` / `store_products` / `store_orders` (Phase 2 — Module 5)
- Per-creator storefront: merchandise, tickets, courses, digital downloads
- Orders generate `revenue_ledger` lines (live event tickets → 80/15/5)

### `platform_insider_subscriptions` (Phase 2)
- `user_id`, `stripe_subscription_id`, `status`, `current_period_end`
- Benefits: early access, roadmaps, town halls (content managed in CMS or `system_announcements`)

### `sponsorship_deals` (Phase 2 — Module 4)
- Brand, creator, amount, deliverables, status, linked campaigns

### `creator_impact_snapshots` (Phase 2 — Module 8)
- Monthly rollup per creator: earnings breakdown, watch hours, retention, jobs_supported, businesses_funded, etc.

---

## 3. STORAGE STRUCTURE (Cloudflare R2)

Your R2 bucket will have the following directory structure:

- `/avatars/{user_id}.jpg`
- `/banners/{user_id}.jpg`
- `/videos/raw/{video_id}.mp4` (Temporary, deleted after encoding)
- `/videos/hls/{video_id}/master.m3u8`
- `/videos/hls/{video_id}/1080p/` — Full HD segments
- `/videos/hls/{video_id}/720p/` — HD segments
- `/videos/hls/{video_id}/480p/` — SD segments (mobile fallback)
- `/videos/thumbnails/{video_id}.jpg`
- `/podcasts/raw/{podcast_id}.mp3`
- `/podcasts/processed/{podcast_id}/master.m3u8`
- `/podcasts/covers/{podcast_id}.jpg`
- `/playlists/covers/{playlist_id}.jpg`
- `/streams/recordings/{stream_id}/*.m3u8`
- `/ads/banners/{campaign_id}.jpg`
- `/ads/videos/{campaign_id}.mp4`

---

## 4. API ENDPOINTS (MOBILE & WEB READY)

All endpoints prefixed with `/api/v1/`

### Auth (`/auth`)
- `POST /register` — Body: `{ email, username, password }`. Returns JWT access + refresh tokens.
- `POST /login` — Body: `{ email, password }`. Returns JWT. Refresh token set as HttpOnly cookie (web) or returned in body (mobile).
- `POST /refresh` — Uses refresh token to issue a new access token (15 min TTL).
- `POST /oauth/google` — Body: `{ id_token }`. Backend verifies with Google public keys. Creates/links account.
- `POST /oauth/apple` — Body: `{ identity_token, authorization_code }`. Backend verifies with Apple. (Frontend shows Google + Apple buttons — no GitHub OAuth.)
- `POST /logout` — Clears refresh token cookie, invalidates token in Redis blacklist.
- `POST /forgot-password` — Body: `{ email }`. Generates a hashed token, saves to `password_resets`, sends email via Resend/SendGrid.
- `POST /reset-password` — Body: `{ token, new_password }`. Validates token against DB, hashes new password with Argon2.

### Users & Creators (`/users`)
- `GET /me` — Returns full authenticated user profile including coins_balance, follower/following counts.
- `PUT /me` — Body: `{ username?, bio?, avatar?, banner? }`. Avatar/banner uploaded to R2.
- `GET /me/notification-preferences` — Returns toggles for follow, like, comment, live, upload, gift, system.
- `PUT /me/notification-preferences` — Body: `{ type, enabled }`.
- `PUT /me/social-links` — Replace creator external links (Website, Twitter, etc.).
- `GET /:username` — Public creator profile: bio, avatar, follower count, video count, is_live status.
- `POST /:username/follow` — Creates a row in `follows` table. Sends a notification to the creator.
- `DELETE /:username/follow` — Removes the follow relationship.
- `POST /apply-streamer` — Body: `{ description, id_document }`. Creates `streamer_applications` row; sets `streamer_status` to 'pending'.
- `GET /me/notifications` — Paginated list of notifications for the authenticated user.
- `PUT /me/notifications/:id/read` — Mark a notification as read.
- `PUT /me/notifications/read-all` — Mark all as read.
- `DELETE /me/notifications` — Clear all notifications (frontend has "Clear all").
- `GET /me/videos` — Paginated videos uploaded by the authenticated user (`Profile` → Videos tab).
- `GET /me/saved` — Paginated watchlist from `saved_items` (`Profile` → Saved tab).
- `GET /me/liked` — Paginated liked content from polymorphic `likes` (`Profile` → Liked tab).
- `GET /:username/videos` — Public uploads for creator channel (Videos tab on `/creator/[slug]`).
- `GET /:username/playlists` — Public playlists for creator channel (Playlists tab).

### Home & Aggregated Feeds (`/feed`)
- `GET /home` — **Primary home payload** for `/`: `live_now[]`, `continue_watching[]`, `featured_live`, `trending[]`, `new_releases[]`, optional `stories_placeholder` (UI mock only in V1). Reduces client-side waterfall requests.
- `GET /trending` — Optional dedicated trending row if not fully covered by `/home`.

### Videos (Shorts & Movies) (`/videos`)
- `POST /upload/init` — Returns a signed TUS upload URL pointing to R2. Body: `{ type: 'short'|'movie', title, description }`.
- `POST /upload/complete` — Called after TUS finishes. Creates a `videos` row with `status: 'processing'`, dispatches a BullMQ job for FFmpeg encoding.
- `GET /feed/shorts` — Paginated cursor-based feed. Algorithm weighs: recency, likes, creator follow status, user watch history.
- `GET /feed/movies` — Query params: `?genre=Action&year=2024&sort=rating&page=1`. Returns paginated movie list.
- `GET /feed/movies/featured` — Returns the featured/hero movie for the Movies page banner.
- `GET /:id` — Returns full video metadata, HLS master URL, like count, comment count, creator info.
- `POST /:id/like` — Toggle. Inserts/deletes from `likes` table, increments/decrements `videos.likes_count`.
- `DELETE /:id/like` — Explicit unlike.
- `POST /:id/save` — Adds to `saved_videos` (user's watchlist).
- `DELETE /:id/save` — Removes from watchlist.
- `POST /:id/comments` — Body: `{ body, parent_id? }`. Supports nested replies.
- `GET /:id/comments` — Paginated. Top-level comments with nested replies.
- `POST /:id/report` — Body: `{ reason, description? }`. Creates a `reports` row for admin review.

### Playlists (`/playlists`)
- `POST /` — Create a new playlist. Body: `{ title, description, type, visibility }`.
- `PUT /:id/cover` — Upload a cover image for the playlist.
- `GET /:id` — Get playlist metadata and its paginated items.
- `POST /:id/items` — Add an item to the playlist. Body: `{ item_type, item_id, sort_order }`.
- `DELETE /:id/items/:item_id` — Remove an item from the playlist.
- `POST /:id/reorder` — Update sort order of items in bulk.

### Watch History (`/history`)
- `GET /` — Paginated list of user's recently watched videos and podcasts.
- `POST /progress` — Sync playback progress. Body: `{ content_type, content_id, progress_seconds, completed }`.
- `DELETE /:content_type/:content_id` — Remove specific item from history.
- `DELETE /clear` — Clear all watch history.

### Search & Discovery (`/search`)
- `GET /` — Global search. Query params: `?q=xxx&type=all|videos|podcasts|creators&page=1`. Uses Typesense.
- `GET /suggest` — Fast autocomplete endpoint for the search bar (returns top 3 matches per category).

### Podcasts (`/podcasts`)
- `GET /shows` — Paginated podcast shows (frontend `/podcasts` trending grid).
- `GET /shows/:id` — Show metadata + episode list (frontend `/podcast/[id]` can map to episode; show detail optional).
- `GET /shows/featured` — Hero banner on podcasts page.
- `POST /shows` — Create podcast show (creator).
- `POST /episodes/upload/init` — TUS upload for audio.
- `POST /episodes/upload/complete` — Queue encoding job.
- `GET /episodes/feed` — Latest episodes across platform.
- `GET /episodes/:id` — Full episode metadata + audio URL.
- `POST /episodes/:id/play` — Log play + increment plays_count.
- `POST /episodes/:id/like` — Toggle like.

### Livestreams (`/streams`)
- `POST /init` — Generates a temporary RTMP stream key (expires in 5 min). Only for approved streamers. (Frontend: `/go-live`.)
- `POST /webhooks/publish` — MediaMTX on_publish webhook.
- `POST /webhooks/done` — MediaMTX on_publish_done webhook.
- `GET /live` — All active streams sorted by viewer_count DESC.
- `GET /creator/:username/live` — Active stream for creator (avoid `/:id` vs `/:username` route collision).
- `GET /:id` — Stream metadata + HLS playback URL.
- `GET /:id/chat` — Paginated chat replay for VOD recordings.

### Billing & Coins (`/billing`)
- `GET /products` — Lists coin packages (must match frontend: 100/$0.99, 500/$3.99, 1000/$6.99, 5000/$29.99).
- `GET /gifts/catalog` — Returns active gifts from `gift_catalog` (Heart=1, Star=10, Fire=50, Diamond=100, Lion=500, Universe=1000).
- `POST /stripe/create-checkout` — Stripe Checkout for coins OR platform premium. Body: `{ product_type: 'coins'|'premium', package_id?, tier? }`. Returns `{ checkout_url }` for redirect (`CoinsModal`, `/premium`, profile settings Premium panel).
- `POST /subscriptions/create` — Body: `{ creator_id?, tier }`. Creator subscription or platform premium.
- `DELETE /subscriptions/:id` — Cancel subscription.
- `GET /subscriptions/me` — Active subscriptions for user.
- `POST /stripe/webhook` — Stripe sends `checkout.session.completed` event. Backend adds coins to user's balance in an ACID transaction.
- `POST /apple/verify-receipt` — Body: `{ receipt_data }`. Validates with Apple servers. Credits coins.
- `POST /google/verify-receipt` — Body: `{ purchase_token, product_id }`. Validates with Google Play. Credits coins.
- `POST /gifts/send` — Body: `{ receiver_id, gift_type, stream_id? }`. Deducts coins from sender in a DB transaction, creates `gifts` row, emits Socket.IO event to the stream room with animation data.
- `GET /creators/balance` — Returns creator's pending payout balance (sum of gifts received minus platform fee).
- `POST /creators/payouts/request` — Creator requests a withdrawal. Creates `creator_payouts` row with status 'requested'.

### Ads (`/ads`)
- `GET /serve?placement=shorts_interstitial` — Returns an ad to display based on placement type and weighted random selection from active campaigns.
- `POST /track/impression` — Body: `{ campaign_id }`. Logs an ad impression in `analytics_events`. Increments `ad_campaigns.delivered_impressions`.
- `POST /track/click` — Body: `{ campaign_id }`. Logs an ad click. Increments `ad_campaigns.clicks`.

### Analytics (`/analytics`)
- `POST /track` — Batch endpoint. Body: `[{ event_type, target_id, metadata }]`. Buffered in Redis, flushed to `analytics_events` table every 60 seconds.
- `GET /creators/stats` — Returns creator dashboard data: views last 24h/7d/30d, earnings, top performing content, audience country breakdown.

### Admin (`/admin`) — Requires `role: 'admin'`
- `GET /admin/users` — Paginated list of all users with search/filter.
- `PUT /admin/users/:id/ban` — Bans a user account.
- `PUT /admin/users/:id/verify` — Grants verified badge.
- `PUT /admin/users/:id/streamer-status` — Approve/reject streamer applications.
- `GET /admin/reports` — List of pending content reports.
- `PUT /admin/reports/:id` — Action a report: dismiss, delete content, or ban user.
- `DELETE /admin/videos/:id` — Force-delete a video.
- `POST /admin/streams/:id/kill` — Force-stop a livestream via MediaMTX API.
- `GET /admin/payouts` — List pending creator payout requests.
- `PUT /admin/payouts/:id` — Approve or reject a payout.
- `GET /admin/ads/campaigns` — List all ad campaigns.
- `POST /admin/ads/campaigns` — Create a new ad campaign.
- `PUT /admin/ads/campaigns/:id` — Update campaign (pause, edit, etc.).
- `GET /admin/analytics/overview` — Platform-wide stats: DAU, concurrent viewers, revenue today, total streams.

---

## 5. ESSENTIAL SERVICES TO REGISTER

- [ ] **Cloudflare:** Account created. Set up R2 Bucket. Enable CDN caching.
- [ ] **PostgreSQL:** Neon.tech or Supabase account. Get connection string.
- [ ] **Redis:** Upstash or self-hosted in Docker.
- [ ] **Stripe:** Create account. Get Sandbox API keys. Configure webhooks.
- [ ] **Apple Developer Program:** Enroll to get Apple Sign-in keys and IAP credentials.
- [ ] **Google Play Console:** Enroll for Android IAP credentials.
- [ ] **Typesense:** Spin up a Docker container or use Typesense Cloud.
- [ ] **MediaMTX:** Configure `mediamtx.yml` for HLS generation and Auth webhooks.
- [ ] **Resend or SendGrid:** Transactional email for password reset links and streamer application status.

---

## 6. IMPLEMENTATION CHECKLIST (WEEK-BY-WEEK)

### Week 1: Infrastructure, Auth, and Profiles
- [ ] Initialize NestJS Monolith (`nest new api`)
- [ ] Setup Docker Compose (PostgreSQL, Redis, Typesense)
  - [ ] PostgreSQL 16 container with volume persistence
  - [ ] Redis 7 container for caching/queues/rate-limiting
  - [ ] Typesense container for search indexing
- [ ] Configure TypeORM or Prisma for database schema
  - [ ] Create all migration files for tables listed in Section 2
  - [ ] Seed sample data for development
- [ ] Implement JWT Authentication (Login/Register/Refresh)
  - [ ] Password hashing with Argon2
  - [ ] Short-lived Access Token (15 min expiry)
  - [ ] Long-lived Refresh Token (HttpOnly cookie for web, returned in body for mobile)
  - [ ] Token blacklist in Redis on logout
- [ ] Implement Password Reset flow
  - [ ] `POST /forgot-password` — generate hashed token, save to `password_resets` table
  - [ ] Send reset email via Resend or SendGrid with a deep link
  - [ ] `POST /reset-password` — validate token, hash new password, invalidate token
- [ ] Implement Google & Apple OAuth
  - [ ] Verify Google `id_token` against Google's public JWKS
  - [ ] Verify Apple `identity_token` against Apple's public keys
  - [ ] Create or link user accounts from OAuth providers
- [ ] Build User Profile endpoints (GET, Update, Upload Avatar)
  - [ ] Avatar upload to R2 `/avatars/{user_id}.jpg`
  - [ ] Banner upload to R2 `/banners/{user_id}.jpg`
  - [ ] `GET /me/videos`, `GET /me/saved`, `GET /me/liked` for profile tabs
  - [ ] `PUT /me` wired to `EditProfileModal` (display name, bio)
- [ ] Build Creator specific endpoints (Follow/Unfollow logic)
  - [ ] Compound unique constraint on `follows` (follower_id + following_id)
  - [ ] Send notification to the followed creator
- [ ] Implement NestJS Guards for route protection (JwtAuthGuard, RolesGuard)
- [ ] Implement global rate limiting (e.g., 100 req/min per IP on auth routes)

### Week 2: Video Uploads & TUS Protocol
- [ ] Configure Cloudflare R2 connection
  - [ ] Create R2 bucket via Cloudflare dashboard
  - [ ] Generate R2 API token (S3-compatible Access Key + Secret)
  - [ ] Set CORS policy to allow uploads from frontend domain
- [ ] Implement TUS Server inside NestJS for direct R2 uploads
  - [ ] Client calls `POST /videos/upload/init` → backend returns a signed TUS URL
  - [ ] Client uploads directly to R2 (bypasses backend memory limits)
  - [ ] Client calls `POST /videos/upload/complete` when done
- [ ] Setup BullMQ and Redis Queues
  - [ ] Create `video-processing` queue
  - [ ] Create `thumbnail-generation` queue
- [ ] Write FFmpeg Worker to convert MP4 to HLS (.m3u8) in background
  - [ ] Download raw `.mp4` from R2
  - [ ] Transcode to 3 quality tiers: 1080p, 720p, 480p
  - [ ] Generate HLS master playlist (`master.m3u8`) referencing all tiers
  - [ ] Upload `.m3u8` and `.ts` segment files back to R2
  - [ ] Delete the raw `.mp4` from R2 to save storage
  - [ ] Update `videos.status` to 'ready' and set `hls_master_url`
- [ ] Write Worker to generate video thumbnails
  - [ ] Extract frame at 2-second mark using FFmpeg
  - [ ] Upload thumbnail to R2 `/videos/thumbnails/{video_id}.jpg`
- [ ] Handle failure cases: set `videos.status` to 'failed', retry up to 3 times

### Week 3: Content Playback & Interactions
- [ ] Build Shorts Feed endpoint (Pagination)
  - [ ] Cursor-based pagination (not offset-based, for performance)
  - [ ] Algorithm: weigh recency (50%), likes (20%), creator follow status (20%), randomness (10%)
  - [ ] Exclude videos already watched by user (track in Redis SET per user)
- [ ] Build Movies Feed endpoint (Categorized)
  - [ ] Support query params: `?genre=Action&year=2024&sort=rating&page=1`
  - [ ] Build `GET /feed/movies/featured` for the hero banner
- [ ] Implement Video Interactions (Likes, Saves, View Counters)
  - [ ] `POST /:id/like` — insert into `likes` table, increment `videos.likes_count`
  - [ ] `POST /:id/save` — insert into `saved_videos` table (user's watchlist)
  - [ ] View tracking: increment `videos.views_count` + log to `analytics_events`
  - [ ] Prevent duplicate views from same user within 30 seconds (Redis check)
- [ ] Implement Watch History & Playback Sync
  - [ ] `POST /history/progress` — upsert into `watch_history` to save user's timestamp (useful for "Resume Watching" feature)
- [ ] Implement Playlists API
  - [ ] `POST /playlists` — create playlist (video/podcast)
  - [ ] `POST /playlists/:id/items` — add items to playlist
  - [ ] Connect Creator Profile Playlists tab to API
- [ ] Implement Comment System (Nested comments/replies)
  - [ ] Top-level comments: `parent_id = NULL`
  - [ ] Replies: `parent_id = <parent_comment_id>`
  - [ ] Paginate top-level comments, eager-load first 3 replies per comment
  - [ ] Increment `videos.comments_count` on new comment
- [ ] Implement Content Reporting
  - [ ] `POST /:id/report` — creates a `reports` row for admin to review
- [ ] Synchronize Frontend video player with actual HLS URLs
  - [ ] Replace all mock video URLs with real API calls
  - [ ] Integrate HLS.js or Video.js for adaptive bitrate playback

### Week 4: Livestreaming (The Hard Part)
- [ ] Deploy MediaMTX in Docker
  - [ ] Configure `mediamtx.yml` for RTMP ingest on port 1935
  - [ ] Enable LL-HLS output (Low-Latency HLS)
  - [ ] Configure external authentication via HTTP webhook
- [ ] Build NestJS endpoints to generate Stream Tokens for creators
  - [ ] `POST /streams/init` — generates a UUID stream key, stores in Redis with 5-minute TTL
  - [ ] Only users with `streamer_status: 'approved'` can generate keys
- [ ] Handle MediaMTX Webhooks
  - [ ] `on_publish` — MediaMTX calls `POST /streams/webhooks/publish` with the stream key. Backend validates key in Redis. Returns 200 (allow) or 403 (reject).
  - [ ] `on_publish_done` — MediaMTX calls `POST /streams/webhooks/done`. Backend sets `streams.status` to 'ended', clears Redis viewer count.
- [ ] Build `/streams/live` directory endpoint for Frontend
  - [ ] Return all streams where `status = 'live'`, sorted by `viewer_count` DESC
  - [ ] Include creator username, avatar, stream title, category, viewer count
- [ ] Setup Socket.IO Gateway for Realtime Chat
  - [ ] Create `ChatGateway` with `@WebSocketGateway()` decorator
  - [ ] Handle `join_room`, `leave_room`, `send_message` events
  - [ ] Authenticate socket connections via JWT token in handshake

### Week 5: Chat, Gifts, and Realtime Events
- [ ] Implement Socket.IO rooms per livestream
  - [ ] Room name: `stream:{stream_id}`
  - [ ] On connect: add user to room, Redis `INCR stream:{stream_id}:viewers`
  - [ ] On disconnect: Redis `DECR stream:{stream_id}:viewers`
  - [ ] Broadcast updated viewer count to room every 5 seconds
- [ ] Handle chat message broadcasting
  - [ ] Validate message length (max 500 chars)
  - [ ] Rate limit: max 1 message per 2 seconds per user
  - [ ] Broadcast `{ username, avatar, message, timestamp }` to room
  - [ ] Persist message to `stream_messages` table asynchronously (with `timestamp_offset_ms`) for VOD chat replays
  - [ ] Cache last 100 messages in Redis for immediate history delivery to late joiners
- [ ] Setup Stripe Sandbox and Webhooks
  - [ ] Create Stripe products for coin packages (100, 500, 1000, 5000 coins)
  - [ ] Configure Stripe Webhook endpoint: `POST /billing/stripe/webhook`
  - [ ] Handle `checkout.session.completed` event
  - [ ] Verify webhook signature to prevent spoofing
- [ ] Implement Coin Purchasing (Stripe Checkout)
  - [ ] `POST /billing/stripe/create-checkout` — creates a Stripe Checkout Session
  - [ ] On webhook confirmation: increment `users.coins_balance` in an ACID transaction
  - [ ] Create a `transactions` row with provider = 'stripe', status = 'completed'
- [ ] Implement Apple & Google IAP verification
  - [ ] `POST /billing/apple/verify-receipt` — call Apple's `/verifyReceipt` endpoint
  - [ ] `POST /billing/google/verify-receipt` — call Google Play Developer API
- [ ] Implement Gift Sending
  - [ ] `POST /billing/gifts/send` — Body: `{ receiver_id, gift_type, stream_id? }`
  - [ ] In a single DB transaction: deduct coins from sender, create `gifts` row, increment creator's payout balance
  - [ ] Emit Socket.IO event to the stream room: `{ type: 'GIFT', sender, gift_type, coin_value, animation }`
  - [ ] Frontend renders the gift animation overlay on the stream

### Week 6: Search, Moderation, and Polish
- [ ] Sync Videos and Creators to Typesense on creation
  - [ ] On video creation: index `{ id, title, description, genre, creator_name }` to Typesense
  - [ ] On user creation: index `{ id, username, bio }` to Typesense
  - [ ] Use NestJS event listeners to auto-sync on create/update/delete
- [ ] Build Global Search endpoint via Typesense
  - [ ] `GET /search?q=gaming&type=all` — search across videos, creators, and streams
  - [ ] Return results grouped by type with relevance scoring
- [ ] Implement Rate Limiting on critical endpoints
  - [ ] Auth routes: 5 attempts per minute per IP (prevent brute force)
  - [ ] Chat: 1 message per 2 seconds per user
  - [ ] Gift sending: 10 per minute per user (prevent spam)
  - [ ] Use Redis-backed rate limiter (sliding window algorithm)
- [ ] Finalize Frontend Integration (Replace all mocked data with API calls)
  - [ ] Home page: real live streams, real trending content
  - [ ] Shorts page: real feed from `/feed/shorts`
  - [ ] Movies page: real listings from `/feed/movies`
  - [ ] Movie detail: real metadata from `/videos/:id`
  - [ ] Creator profile: real data from `/users/:username`
  - [ ] Search modal: real results from Typesense
- [ ] Load Test Video Encoding and Livestreaming
  - [ ] Simulate 100 concurrent video uploads
  - [ ] Simulate 10,000 concurrent WebSocket connections to a single stream

---

## 7. ADMIN DASHBOARD REQUIREMENTS

A separate Next.js Admin Panel (protected by `role: 'admin'` on all API calls).

### Pages Required:
- [ ] **Dashboard Overview** — DAU, concurrent viewers, revenue today, active streams, pending reports count.
- [ ] **User Management** — Searchable/filterable table of all users. Actions: Ban, Suspend, Verify (blue checkmark), Approve/Reject streamer applications, Reset password.
- [ ] **Content Moderation** — Grid of reported content (from `reports` table). Each report shows: reporter, target content (video/comment/stream), reason. Actions: Dismiss report, Delete content, Ban the offending user.
- [ ] **Live Stream Control** — List of currently live streams. Action: "Kill Stream" button that calls MediaMTX API to force-disconnect the RTMP session.
- [ ] **Payouts** — Table of pending `creator_payouts` requests. Shows creator name, amount, method. Actions: Approve (triggers bank transfer/PayPal), Reject (with reason).
- [ ] **Ad Campaign Manager** — CRUD for `ad_campaigns`. Create new campaign: upload media, set placement type, budget, date range. View performance: impressions delivered, clicks, CTR.
- [ ] **Platform Analytics** — Charts showing: daily active users (7d/30d), revenue breakdown (coins purchased vs subscriptions), top performing content, viewer hours by category.

---

## 8. PRIVATE ADVERTISING SYSTEM

We do NOT use Google AdSense. We run our own private ad network.

### Ad Placement Locations:
1. **`home_banner`** — A large banner on the homepage, above the "Live Now" section.
2. **`shorts_interstitial`** — A full-screen video ad injected every 5-10 swipes in the Shorts feed. User can skip after 5 seconds.
3. **`movie_preroll`** — A 15-30 second video ad played before a movie starts. Unskippable for free users; skippable or removed for subscribers.

### How It Works:
1. Admin creates an `ad_campaign` with media URL, placement type, target impressions, and budget.
2. Frontend calls `GET /ads/serve?placement=shorts_interstitial` when it needs to show an ad.
3. Backend selects an active campaign for that placement using weighted random selection (campaigns with more remaining budget get higher weight).
4. Frontend renders the ad (image banner or video player).
5. When the ad is visible for > 3 seconds, frontend calls `POST /ads/track/impression`.
6. If the user clicks the ad, frontend calls `POST /ads/track/click` and opens the `click_through_url`.
7. When `delivered_impressions >= target_impressions`, campaign status auto-sets to 'completed'.

### Revenue Model:
- Advertisers pay per 1,000 impressions (CPM) or per click (CPC).
- Platform keeps primary ad revenue; **allocate a configurable portion to GAF** per stakeholder funding model (see `gaf_ledger` inflow `source: advertising`).
- **Phase 2:** Business Advertising Portal — self-serve campaigns, audience/geo/demographic analytics, conversion tracking, **community impact reports** for B2B sales.

---

## 9. ANALYTICS & STATS SYSTEM

### Where Data is Stored:
- **Hot data (last 5 minutes):** Redis Streams — every view, impression, click is pushed here first.
- **Warm data (aggregated):** PostgreSQL `analytics_events` table — a cron job flushes Redis streams into PostgreSQL every 60 seconds.
- **Cold data (historical):** After 90 days, old `analytics_events` rows can be archived to cheaper storage or summarized into daily aggregate tables.

### What is Tracked:
- Video views (with watch duration in `metadata` JSONB)
- Ad impressions and clicks
- Shares (which platform: copy link, Twitter, WhatsApp)
- Search queries (for trending topics)
- Stream viewer minutes (for creator earnings calculations)

### Creator Dashboard Stats (**Creator Impact Dashboard™** — partial implementation):

- **API:** `GET /analytics/creators/me/dashboard` (wired to profile **Performance & Revenue** menu)
- **Ad views on creator videos:** `content_ad_events` via `POST /ads/track/impression` with `creatorId` + `videoId`
- **Program verticals (founder list):** `creator_program_verticals` — Podcasts, Sports, Concerts, Community, Education (not the same as Premium/Insider tiers)
- **Partner tier (admin):** `users.partner_tier` — optional perks ladder (`standard` → `flagship`)

Legacy bullets:
- Total views (24h / 7d / 30d)
- Total earnings from gifts and subscriptions
- Top 5 performing videos
- Audience demographics: top countries, device breakdown (mobile vs desktop)
- Follower growth over time
- **Phase 2 additions:** monthly earnings breakdown (ads, sponsorships, merch, donations), watch hours, retention, **community impact** (jobs supported, businesses funded, GAF dollars attributed, workforce opportunities)

### Admin Platform Stats:
- Real-time concurrent viewers across all streams
- Daily/Monthly Active Users (DAU/MAU)
- Total platform revenue: coin purchases + subscriptions
- Ad campaign performance: total impressions, clicks, CTR, revenue
- Content health: number of reports filed, moderation actions taken

---

## 10. MONETIZATION FLOW DETAILS

> **Stakeholder rules (authoritative):** See [`stakeholder-product-requirements.md`](../web/stakeholder-product-requirements.md.  
> - **Live events** (tickets/PPV): Creator **80%** · PRYSYM **15%** · GAF **5%**  
> - **Viewer support** (tips, donations, super chats, digital gifts): Creator **90%** · PRYSYM **5%** · GAF **5%**  
> - **Platform Insider Membership** ($4.99/mo): **80%** platform development · **10%** GAF · **10%** Creator Development Fund  
> Implement via `revenue_split_rules` + `revenue_ledger` (Phase 2). The **30% platform cut on gifts below is legacy V1 placeholder** — replace before production monetization goes live.

### Coin Economy:
| Package | Coins | Price (USD) | Platform Cut |
|---------|-------|-------------|--------------|
| Starter | 100   | $0.99       | 30%          |
| Popular | 500   | $3.99       | 30%          |
| Premium | 1,000 | $6.99       | 30%          |
| Mega    | 5,000 | $29.99      | 30%          |

### Gift Types:
| Gift Name | Coin Cost | Animation |
|-----------|-----------|----------|
| Heart     | 1         | Small floating heart |
| Star      | 10        | Star burst |
| Fire      | 50        | Fire explosion |
| Diamond   | 100       | Diamond rain |
| Lion      | 500       | Lion roar full-screen |
| Universe  | 1,000     | Galaxy explosion |

### Creator Payout Rules:
- **Target (stakeholder):** 90/5/5 on viewer support (gifts, tips, donations, super chats) via revenue engine.
- **V1 placeholder (until Phase 2):** 30% platform cut on coin gifts — do not ship to production without migrating splits.
- Minimum payout: $50 USD.
- Payout methods: PayPal, Bank Transfer, Crypto (USDT).
- Payout frequency: On-demand (creator requests), processed within 3-5 business days after admin approval.

### Subscriber Benefits:
- Ad-free viewing on subscribed creator's content.
- Special badge in live chat.
- Access to subscriber-only streams (if creator enables it).
- Price: Set by creator ($2.99 / $4.99 / $9.99 per month tiers).

---

## 11. FRONTEND ↔ BACKEND ROUTE MAP (UI-COMPLETE)

The Next.js frontend is **UI-complete** and consumes live APIs on most routes (`lib/api/*`). `lib/mock-data.ts` was removed. Profile tabs use `GET /users/me/*` and `GET /history`. See **§14.5** for engagement/UI items still pending on the frontend.

### 11.1 Profile settings sheet (in-app UX)

Settings are **not standalone pages** in normal use. The gear on `/profile` opens `ProfileSettingsSheet` (stacked panels with back navigation). Legacy URLs redirect via `components/settings-redirect.tsx`:

| URL (bookmark / deep link) | Opens on profile |
|---|---|
| `/profile?settings=notifications` | Notification toggles |
| `/profile?settings=dashboard` | Performance & Revenue (`GET /analytics/creators/me/dashboard`) |
| `/profile?settings=help` | FAQs + support links |
| `/profile?settings=premium` | Platform subscription tiers |
| `/profile?settings=history` | Watch history (play → `/watch/[id]`) |
| `/profile?settings=go-live` | RTMP / OBS setup |
| `/profile?settings=upload` | TUS upload flow |

Same APIs as the table below; no separate page layouts required.

### 11.2 Page routes

| Frontend Route | Purpose | Primary API(s) |
|---|---|---|
| `/` | Home feed, ads, stories (mock), category tabs | `GET /feed/home`, `GET /ads/serve?placement=home_banner` |
| `/shorts` | Vertical short feed + interstitial ads | `GET /videos/feed/shorts`, `GET /ads/serve?placement=shorts_interstitial` |
| `/movies` | Movie catalog + hero | `GET /videos/feed/movies`, `GET /videos/feed/movies/featured` |
| `/movie/[id]` | Movie detail + preroll ad + player | `GET /videos/:id`, `GET /ads/serve?placement=movie_preroll`, `POST /history/progress` |
| `/watch`, `/watch/[id]` | Long-form video + comments + share | `GET /videos/:id`, `POST /:id/comments`, `POST /:id/like`, `POST /:id/save` |
| `/live/[id]` | Live player + chat + gifts | Socket.IO, `GET /streams/:id`, `POST /billing/gifts/send` |
| `/podcasts` | Podcast hub + mini player | `GET /podcasts/episodes/feed`, `GET /podcasts/shows` |
| `/podcast/[id]` | Episode detail + audio | `GET /podcasts/episodes/:id`, `POST /episodes/:id/play` |
| `/playlist/[id]` | Playlist detail | `GET /playlists/:id` |
| `/creator/[slug]` | Public creator channel | `GET /users/:username`, `GET /:username/videos`, follow/subscribe, tabs |
| `/profile` | Account, tabs, coins, **settings sheet** | `GET /me`, `GET /me/videos`, `GET /me/saved`, `GET /me/liked`, `GET /history` |
| `/upload`, `/go-live`, `/history`, `/premium`, `/help`, `/settings/notifications`, `/creator/dashboard` | Redirect → `/profile?settings=*` | Same APIs as settings panels |
| `/terms`, `/privacy`, `/cookies`, `/guidelines` | Static legal (no API V1) | — |

### 11.3 Shared UI components → API wiring

| Component | File | API(s) |
|---|---|---|
| `AuthModal` | `components/auth-modal.tsx` | `POST /auth/register`, `/login`, `/oauth/google`, `/oauth/apple`, `/forgot-password`, `/reset-password` |
| `auth-context` | `contexts/auth-context.tsx` | JWT in memory + refresh; replace `localStorage` mock user with `GET /me` |
| `EditProfileModal` | `components/edit-profile-modal.tsx` | `PUT /me` (display name, bio); avatar via presigned R2 upload |
| `StreamerApplicationModal` | `components/streamer-application-modal.tsx` | `POST /users/apply-streamer` (multipart `id_document`) |
| `ProfileSettingsSheet` | `components/profile-settings-sheet.tsx` | Panels map to APIs in 11.1 (notifications, dashboard, upload, go-live, etc.) |
| `CoinsModal` | `components/coins-modal.tsx` | `GET /billing/products`, `POST /billing/stripe/create-checkout` |
| `NotificationsModal` | `components/notifications-modal.tsx` | `GET /me/notifications`, read/clear endpoints |
| `SearchModal` | `components/search-modal.tsx` | `GET /search`, `GET /search/suggest` |
| `ReportModal` | `components/report-modal.tsx` | `POST /videos/:id/report` (+ stream/user variants) |
| `ShareSheet` | `components/share-sheet.tsx` | `POST /analytics/track` with `event_type: 'share'` |
| `AdBanner`, `AdInterstitial`, `AdPreroll` | `components/ad-*.tsx` | `GET /ads/serve`, `POST /ads/track/impression`, `POST /ads/track/click` |
| `StoryViewer` + home stories row | `components/story-viewer.tsx` | **V1:** no API (Section 13) |
| `login-prompt` | `components/login-prompt.tsx` | Opens `AuthModal` — no direct API |

---

## 12. ADDITIONAL IMPLEMENTATION WEEKS

### Week 7: Podcasts, Playlists & Home Aggregation
- [ ] Implement `podcast_shows` + `podcast_episodes` migrations (replace flat `podcasts`).
- [ ] Build podcast show/episode CRUD and feeds.
- [ ] Build `GET /feed/home` — aggregated rows for home page (live, continue watching, trending, new releases).
- [ ] Wire `/podcasts`, `/podcast/[id]`, `/playlist/[id]` frontend to real APIs.
- [ ] Index podcasts in Typesense.

### Week 8: Ads, Premium & Notifications
- [ ] Implement private ad network (`ad_campaigns`, serve + track endpoints).
- [ ] Wire `AdBanner`, shorts interstitial, movie preroll to live campaigns.
- [ ] Implement platform premium subscriptions (Stripe) for `/premium`.
- [ ] Extend notification types (live, upload) + clear-all endpoint.
- [ ] Wire `NotificationsModal` bell to real-time (Socket.IO or polling).

### Week 9: Admin Panel + Creator Dashboard
- [ ] Build separate Next.js admin app (Section 7).
- [ ] Streamer application review UI → `streamer_applications` table.
- [x] Profile **Performance & Revenue** → `GET /analytics/creators/me/dashboard`
- [ ] Wire ad players to `POST /ads/track/impression` with creator + video attribution
- [ ] Wire `/creator/dashboard` redirect (same API)
- [ ] Payout approval flow.

### Week 10: Integration Hardening
- [ ] Replace all `lib/mock-data.ts` imports with API client hooks.
- [ ] HLS.js player integration (replace direct MP4 URLs).
- [ ] Resume playback via `POST /history/progress` on all players.
- [ ] E2E tests for auth, upload, live, gifts, ads.
- [ ] Observability: Sentry, health checks, staging environment.

### Week 11–12: Economy core (Stakeholder Modules 2, 6, 9)
- [x] **Schema migrated** (`20260602114129_phase2_economy_schema`) — all Phase 2 tables + `videos.vertical`
- [x] `revenue_split_rules` seeded; `RevenueSplitService` + admin GET/PUT (no hardcoded % in code)
- [ ] Wire gifts/tips/ads checkout to `RevenueSplitService.distributeAndPersist`
- [ ] `revenue_ledger` usage in all monetization flows
- [ ] Viewer support: tips, donations, super chats (in addition to gifts); **90/5/5** splits
- [ ] `gaf_ledger` inflows from viewer support + configurable ad allocation
- [ ] Stripe Connect or equivalent for creator balances
- [ ] Migrate gift sending to ledger-based splits

### Week 13–14: Creator Store & live events (Modules 5 + verticals)
- [ ] `creator_stores`, `store_products`, `store_orders` (merch, tickets, courses, digital)
- [ ] `live_events` for Sports, Concerts, Community, Education
- [ ] Ticket/PPV checkout with **80/15/5** split
- [ ] Feeds: `GET /feed/sports`, `/events`, `/concerts`, `/education` (or unified `GET /events?type=`)

### Week 15–16: Ads & sponsorships (Modules 3, 4, 13, 14)
- [ ] Business advertiser portal (self-serve)
- [ ] `sponsorship_deals` marketplace
- [ ] Advertiser analytics + community impact reporting APIs

### Week 17–18: Dashboards & Insider (Modules 7, 8 + Insider Membership)
- [x] `GET /analytics/creators/me/dashboard` (financial + performance + impact + ads on content)
- [x] Profile settings panel wired (Performance & Revenue)
- [ ] Platform Insider Membership ($4.99) — Stripe product + **80/10/10** split

### Week 19–20: Payouts, tax, fraud (Modules 10, 11, 12)
- [ ] Automated monthly payout job
- [ ] Tax documentation (W-9, 1099 export)
- [ ] Verified view engine + gift/payment fraud rules

Full module matrix: [`stakeholder-product-requirements.md`](./stakeholder-product-requirements.md#8-developer-implementation-modules-14-modules).

---

## 13. OUT OF SCOPE (V1) — DOCUMENTED DECISIONS

These frontend UI elements exist but are **deferred** unless product decides otherwise:

| Feature | Frontend state | Backend decision |
|---|---|---|
| Stories (Instagram-style) | Mock viewer on home | No schema in V1 — use live status + shorts instead |
| Dislike button | `/watch/[id]` | ✅ API: `POST /videos/:id/dislike` (mutually exclusive with like); frontend wiring pending |
| Super Chat | Mentioned in CoinsModal | **In scope (stakeholder)** — Phase 2 Module 6 with 90/5/5 split; not replaced by gifts alone |
| Sports / Concerts / Community / Education hubs | Not in UI routes yet | Phase 2 verticals + `live_events` — see stakeholder doc |
| Creator Store™, GAF, Impact Dashboard, Insider $4.99 | Not in UI | Phase 2–3 — see stakeholder doc |
| Business advertiser self-serve portal | Admin-only ads in V1 plan | Phase 2 Module 13 |
| Chromecast button | Header icon, no behavior | Client-side Cast SDK later |
| Password reset OTP | AuthModal uses 6-digit code UI | **Use email link + token** (Section 4 Auth) — update AuthModal when API is ready |

---

## 14. INTEGRATION CHECKLIST (REPLACE MOCK DATA)

### 14.1 Frontend foundation (do first)
- [ ] Add `.env.local`: `NEXT_PUBLIC_API_URL=https://api.prysym.tv/api/v1` (or staging URL).
- [ ] Create `lib/api-client.ts` — `fetch` wrapper, attach `Authorization: Bearer`, refresh on 401, typed errors.
- [ ] Create `lib/api/` modules (e.g. `auth.ts`, `videos.ts`, `users.ts`) or React Query hooks.
- [ ] Update `contexts/auth-context.tsx` — real login/logout/refresh; hydrate from `GET /me` on load.
- [ ] Update `AuthModal` — wire forms to auth endpoints; align password reset with **email link** (not OTP-only).

### 14.2 Replace `lib/mock-data.ts` consumers
- [ ] `app/page.tsx` → `GET /feed/home`
- [ ] `app/shorts/page.tsx` → `GET /videos/feed/shorts` + ad serve
- [ ] `app/movies/page.tsx` → movie feeds
- [ ] `app/watch/[id]/page.tsx`, `app/movie/[id]/page.tsx` → `GET /videos/:id`, HLS player, history progress
- [ ] `app/live/[id]/page.tsx` → `GET /streams/:id`, Socket.IO chat, gifts
- [ ] `app/creator/[slug]/page.tsx` → `GET /users/:username`, channel tabs
- [ ] `app/podcasts/page.tsx`, `app/podcast/[id]/page.tsx`, `app/playlist/[id]/page.tsx`
- [ ] `components/featured-live.tsx`, `content-row`, cards — pass API data from parents
- [ ] Ad components → live `ad_campaigns`

### 14.3 Profile & settings
- [ ] `app/profile/page.tsx` — remove inline `userVideos` / `savedItems` / `watchHistory` mocks; use `GET /me`, `GET /me/videos`, `GET /me/saved`, `GET /me/liked`, `GET /history`
- [ ] `ProfileSettingsSheet` — `GET/PUT /me/notification-preferences`; dashboard → `GET /analytics/creators/stats`; upload → TUS; go-live → `POST /streams/init`; premium → Stripe
- [ ] `EditProfileModal` → `PUT /me`
- [ ] `StreamerApplicationModal` → `POST /users/apply-streamer`
- [ ] Creator subscribe on `/creator/[slug]` — require auth + `POST /subscriptions/create` or follow endpoints

### 14.4 Players & realtime
- [ ] Integrate **HLS.js** (or Video.js) — replace direct MP4 `videoUrl` from mocks.
- [ ] `POST /history/progress` on interval during playback (watch, movie, podcast).
- [ ] Socket.IO client for `/live/[id]` chat and gift animations.

### 14.5 Engagement parity ✅ (backend + frontend)

| Feature | API | Frontend |
|---------|-----|----------|
| Video like/save/dislike hydration | `GET /videos/:id` + shorts feed | watch, movie, shorts |
| Video view counter | `POST /videos/:id/view` | watch, movie, shorts |
| Comment likes + replies | comments API | watch, shorts |
| Follow hydration on watch | `isFollowing` on `GET /videos/:id` | watch |
| Podcast save + feed hydration | podcasts save/like | podcast page, feed |
| Vertical like/save/view | verticals engagement routes | vertical watch |
| Creator notify bell | live-alerts | creator profile |
| Streamer ID upload | streamer-id upload | streamer modal |
| Share analytics | `POST /analytics/track` | ShareSheet |
| Reports on podcasts/verticals | `podcast_episode`, `vertical_episode` | podcast + vertical watch |
| Profile saved/liked tabs | `GET /me/saved`, `GET /me/liked` | profile (all item types) |
| Playlist remove/reorder | playlists API | playlist detail (owner) |
| History per-item delete | `DELETE /history/:type/:id` | settings history |
| Social links editor | `PUT /users/me/social-links` | settings social |
| Channel membership cancel | `DELETE /billing/subscriptions/:id` | settings premium |

**Polish & QA (done):** profile saved/liked cards for podcast/vertical/series; continue-watching row uses full history mapper; playlist reorder; report modals on podcast/vertical; auth modal on vertical engagement.

**Next:** Admin moderation UI (§14.6), then production deploy.

### 14.6 Monetization & admin
- [ ] `CoinsModal` → Stripe checkout + webhook balance update.
- [ ] Gifts → `GET /billing/gifts/catalog` + `POST /billing/gifts/send`.
- [ ] Premium → subscription create + webhook.
- [ ] Admin panel (separate app) → all `/admin/*` routes.

### 14.6 Environment & deployment
- [ ] Frontend: Vercel (or similar) — env vars for API URL.
- [ ] Backend: Docker on VPS / Railway / Fly — Postgres, Redis, MediaMTX, workers.
- [ ] CORS: allow frontend origin on API.
- [ ] GitHub: [HostylerWeb/PrysymTV](https://github.com/HostylerWeb/PrysymTV) — frontend repo; recommend monorepo or `prysym-api` repo for NestJS.

---

## 15. STAKEHOLDER REQUIREMENTS ↔ ENGINEERING (SUMMARY)

Canonical detail: **[`stakeholder-product-requirements.md`](../web/stakeholder-product-requirements.md**.

### 15.1 Content pillars (beyond current mock catalog)

| Pillar | Discovery (proposed) | Monetization |
|--------|----------------------|--------------|
| Podcasts | `/podcasts` (exists) | Ads, tips, subs |
| Sports | `/sports`, `live_events.type=sports` | Tickets, live PPV 80/15/5 |
| Concerts | `/concerts` | Tickets + VOD |
| Community Events | `/events` + geo/calendar | Tickets, donations |
| Educational Programs | `/learn` | Course sales (Creator Store) |

### 15.2 Revenue splits (config-driven)

| Transaction type | Creator | PRYSYM | GAF | Notes |
|------------------|---------|--------|-----|-------|
| Live event / ticket / PPV | 80% | 15% | 5% | |
| Tips, donations, super chats, gifts | 90% | 5% | 5% | |
| Insider Membership ($4.99) | — (10% Creator Dev Fund) | 80% | 10% | Not creator subscription tiers |

### 15.3 GAF funding & investment (reporting + future programs)

**Inflows to track:** advertising, sponsorship, marketplace, membership, grants, donations.  
**Investment priorities:** economic development, workforce, housing, youth (media training aligns with creator education vertical).

### 15.4 Fourteen modules → ownership

| Module | Owner phase | Key tables / APIs |
|--------|-------------|-------------------|
| 1 Creator Management | Week 1 ✅ | `users`, streamer apply |
| 2 Revenue Distribution | Week 11–12 | `revenue_split_rules`, `revenue_ledger` |
| 3 Advertising | Week 8 + 15–16 | `ad_campaigns`, `/advertisers/*` |
| 4 Sponsorship | Week 15–16 | `sponsorship_deals` |
| 5 Creator Store | Week 13–14 | `creator_stores`, `store_*` |
| 6 Donation & Tip | Week 11–12 | `viewer_support_transactions` |
| 7 Creator Analytics | Week 9 + 17–18 | `analytics_events`, aggregates |
| 8 Impact Dashboard | Week 17–18 | `creator_impact_snapshots` |
| 9 GAF Ledger | Week 11–12 | `gaf_ledger` |
| 10 Monthly Payouts | Week 19–20 | cron + `creator_payouts` |
| 11 Tax docs | Week 19–20 | tax_profiles, exports |
| 12 Fraud / verified views | Week 19–20 | Redis + rules engine |
| 13 Business ad portal | Week 15–16 | advertiser auth + campaigns |
| 14 Community impact reports | Week 15–16 | impact_report_generations |

### 15.5 Conflicts to resolve before launch

1. **Gift platform cut (30% in Section 10) vs stakeholder 90/5/5** — implement ledger first.  
2. **Platform premium tiers in UI vs Insider Membership ($4.99)** — separate products.  
3. **100% platform ad revenue vs GAF inflows from ads** — configurable GAF allocation %.  
4. **Super Chat** — remove “defer” mindset; plan Module 6.

---
**END OF PLAN**

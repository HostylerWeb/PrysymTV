# Master Backend Development Plan: 0 to 100%

This document serves as the ultimate blueprint and checklist for building the PrysymTV/StreamVerse backend. It details the architecture, database schema, API endpoints, and a week-by-week implementation checklist.

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
- `bio` (Text)
- `is_verified` (Boolean)
- `streamer_status` (Enum: 'none', 'pending', 'approved', 'rejected')
- `coins_balance` (Integer)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### `videos` (Shorts & Movies)
- `id` (UUID, PK)
- `creator_id` (UUID, FK -> users.id)
- `type` (Enum: 'short', 'movie')
- `title` (String)
- `description` (Text)
- `thumbnail_url` (String)
- `hls_master_url` (String)
- `duration_seconds` (Integer)
- `visibility` (Enum: 'public', 'private', 'unlisted')
- `status` (Enum: 'processing', 'ready', 'failed')
- `views_count` (Integer)
- `likes_count` (Integer)
- `comments_count` (Integer)
- `created_at` (Timestamp)

### `podcasts` (Audio content)
- `id` (UUID, PK)
- `creator_id` (UUID, FK -> users.id)
- `title` (String)
- `description` (Text)
- `cover_url` (String) — Cover image for the podcast
- `audio_url` (String) — HLS or processed audio URL in R2
- `duration_seconds` (Integer)
- `category` (String)
- `visibility` (Enum: 'public', 'private', 'unlisted')
- `status` (Enum: 'processing', 'ready', 'failed')
- `plays_count` (Integer)
- `likes_count` (Integer)
- `created_at` (Timestamp)

### `streams` (Livestreams)
- `id` (UUID, PK)
- `creator_id` (UUID, FK -> users.id)
- `title` (String)
- `category` (String)
- `status` (Enum: 'scheduled', 'live', 'ended')
- `viewer_count` (Integer)
- `temporary_stream_token` (String, nullable)
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

### `saved_videos` (User Watchlist)
- `user_id` (UUID, FK -> users.id)
- `video_id` (UUID, FK -> videos.id)
- `created_at` (Timestamp)
- PK: (`user_id`, `video_id`)

### `likes`
- `user_id` (UUID, FK -> users.id)
- `video_id` (UUID, FK -> videos.id)
- `created_at` (Timestamp)
- PK: (`user_id`, `video_id`)

### `notifications`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `type` (Enum: 'follow', 'like', 'comment', 'gift', 'system')
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
- `POST /oauth/apple` — Body: `{ identity_token, authorization_code }`. Backend verifies with Apple.
- `POST /logout` — Clears refresh token cookie, invalidates token in Redis blacklist.
- `POST /forgot-password` — Body: `{ email }`. Generates a hashed token, saves to `password_resets`, sends email via Resend/SendGrid.
- `POST /reset-password` — Body: `{ token, new_password }`. Validates token against DB, hashes new password with Argon2.

### Users & Creators (`/users`)
- `GET /me` — Returns full authenticated user profile including coins_balance, follower/following counts.
- `PUT /me` — Body: `{ username?, bio?, avatar? }`. Avatar is uploaded to R2 `/avatars/`.
- `GET /:username` — Public creator profile: bio, avatar, follower count, video count, is_live status.
- `POST /:username/follow` — Creates a row in `follows` table. Sends a notification to the creator.
- `DELETE /:username/follow` — Removes the follow relationship.
- `POST /apply-streamer` — Sets `streamer_status` to 'pending'. Admin reviews in dashboard.
- `GET /me/notifications` — Paginated list of notifications for the authenticated user.
- `PUT /me/notifications/:id/read` — Mark a notification as read.

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

### Podcasts (`/podcasts`)
- `POST /upload/init` — Returns a signed TUS upload URL pointing to R2 for audio upload. Body: `{ title, description, category }`.
- `POST /upload/complete` — Called after TUS finishes. Creates a `podcasts` row with `status: 'processing'`, dispatches a BullMQ job for audio encoding/processing.
- `POST /:id/cover` — Upload a cover image for the podcast.
- `GET /feed` — Paginated list of podcasts. Query params: `?category=Tech&sort=popular`.
- `GET /trending` — Top podcasts based on plays_count and recency.
- `GET /:id` — Returns full podcast metadata, audio URL, like count, and creator info.
- `POST /:id/play` — Logs a play event and increments `podcasts.plays_count`.
- `POST /:id/like` — Toggles like for the podcast.

### Livestreams (`/streams`)
- `POST /init` — Generates a temporary RTMP stream key (expires in 5 min). Only for approved streamers.
- `POST /webhooks/publish` — Called by MediaMTX when OBS connects. Validates the stream key. Returns 200 to allow or 403 to reject.
- `POST /webhooks/done` — Called by MediaMTX when stream ends. Sets `streams.status` to 'ended', clears viewer count in Redis.
- `GET /live` — Lists all active streams sorted by `viewer_count` DESC. Includes creator info and thumbnail.
- `GET /:username` — Returns the active stream for a specific creator (or 404 if offline).

### Billing & Coins (`/billing`)
- `GET /products` — Lists coin packages: `[{ id, coins: 100, price_usd: 0.99 }, { coins: 500, price_usd: 3.99 }, ...]`
- `POST /stripe/create-checkout` — Creates a Stripe Checkout Session. Returns `{ checkout_url }` for redirect.
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
  - [ ] Optionally persist last 100 messages in Redis for late joiners
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
- Platform keeps 100% of ad revenue (this is separate from creator monetization).

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

### Creator Dashboard Stats:
- Total views (24h / 7d / 30d)
- Total earnings from gifts and subscriptions
- Top 5 performing videos
- Audience demographics: top countries, device breakdown (mobile vs desktop)
- Follower growth over time

### Admin Platform Stats:
- Real-time concurrent viewers across all streams
- Daily/Monthly Active Users (DAU/MAU)
- Total platform revenue: coin purchases + subscriptions
- Ad campaign performance: total impressions, clicks, CTR, revenue
- Content health: number of reports filed, moderation actions taken

---

## 10. MONETIZATION FLOW DETAILS

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
- Platform takes 30% of all gifts received (industry standard: TikTok takes 50%).
- Minimum payout: $50 USD.
- Payout methods: PayPal, Bank Transfer, Crypto (USDT).
- Payout frequency: On-demand (creator requests), processed within 3-5 business days after admin approval.

### Subscriber Benefits:
- Ad-free viewing on subscribed creator's content.
- Special badge in live chat.
- Access to subscriber-only streams (if creator enables it).
- Price: Set by creator ($2.99 / $4.99 / $9.99 per month tiers).

---
**END OF PLAN**

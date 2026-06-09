# Prysym TV — REST API Reference

**Base URL:** `http://localhost:4000/api/v1` (development)  
**Auth:** Bearer access token in `Authorization` header. Refresh token in HttpOnly cookie `prysym_refresh` (web).  
**Content-Type:** `application/json` unless noted.

**Status legend**

| Status | Meaning |
|--------|---------|
| ✅ Implemented | Works for local dev |
| 🚧 Partial | Route exists; limited or placeholder behavior |
| 📋 Planned | Not implemented (Phase 2+ namespaces below) |

---

## Endpoint index (all routes)

| Method | Path | Status |
|--------|------|--------|
| `GET` | `/` | ✅ API root message |
| `GET` | `/health` | ✅ |
| `POST` | `/auth/register` | ✅ |
| `POST` | `/auth/login` | ✅ |
| `POST` | `/auth/refresh` | ✅ |
| `POST` | `/auth/logout` | ✅ |
| `POST` | `/auth/forgot-password` | ✅ |
| `POST` | `/auth/reset-password` | ✅ |
| `POST` | `/auth/oauth/google` | 📋 |
| `POST` | `/auth/oauth/apple` | 📋 |
| `GET` | `/users/me` | ✅ |
| `PUT` | `/users/me` | ✅ |
| `GET` | `/users/me/notification-preferences` | ✅ |
| `PUT` | `/users/me/notification-preferences` | ✅ |
| `PUT` | `/users/me/social-links` | ✅ |
| `POST` | `/users/apply-streamer` | ✅ Dev: `AUTO_APPROVE_STREAMER=true` approves instantly |
| `POST` | `/users/apply-vertical-creator` | ✅ `{ description, idDocumentUrl, portfolioUrl? }` — dev: `AUTO_APPROVE_VERTICAL_CREATOR=true` |
| `POST` | `/users/request-creator-access` | ✅ `{ features: ['vertical','live'], description? }` — verified streamers auto-unlock vertical |
| `POST` | `/reports` | ✅ Bearer — `{ targetType, targetId, reason, details? }` |
| `GET` | `/users/me/videos` | ✅ |
| `GET` | `/users/me/saved` | ✅ |
| `GET` | `/users/me/liked` | ✅ |
| `GET` | `/users/me/notifications` | ✅ |
| `PUT` | `/users/me/notifications/:id/read` | ✅ |
| `PUT` | `/users/me/notifications/read-all` | ✅ |
| `DELETE` | `/users/me/notifications` | ✅ |
| `POST` | `/users/me/avatar/upload` | ✅ Presign / local profile image |
| `POST` | `/users/me/banner/upload` | ✅ |
| `POST` | `/users/me/streamer-id/upload` | ✅ Presign / local ID document for streamer application |
| `GET` | `/users/:username/videos` | ✅ Public creator uploads |
| `GET` | `/users/:username/playlists` | ✅ Public playlists |
| `GET` | `/users/:username` | ✅ Includes `isFollowing`, `isChannelMember`, `liveAlertsOn` |
| `POST` | `/users/:username/follow` | ✅ |
| `DELETE` | `/users/:username/follow` | ✅ |
| `POST` | `/users/:username/live-alerts` | ✅ Toggle live notifications for a creator (notify bell) |
| `GET` | `/feed/home` | ✅ |
| `GET` | `/feed/trending` | ✅ |
| `POST` | `/videos/upload/init` | ✅ |
| `POST` | `/videos/upload/complete` | ✅ |
| `GET` | `/videos/feed/shorts` | ✅ Optional JWT → per-item `liked`, `saved`, `disliked` |
| `GET` | `/videos/feed/movies` | ✅ |
| `GET` | `/videos/feed/movies/featured` | ✅ |
| `GET` | `/videos/feed/videos` | ✅ Long-form browse — `vertical`, `sort`, `mode`, `page`, `limit`, `q` |
| `GET` | `/videos/:id/comments` | ✅ Optional JWT → each comment/reply includes `liked` |
| `POST` | `/videos/:id/comments` | ✅ Bearer; `{ body, parentId? }` |
| `POST` | `/videos/comments/:commentId/like` | ✅ Toggle comment like |
| `GET` | `/videos/:id` | ✅ Optional JWT → `liked`, `saved`, `disliked`, `isFollowing`, `dislikesCount` |
| `POST` | `/videos/:id/view` | ✅ Increment `viewsCount` on play |
| `POST` | `/videos/:id/like` | ✅ Toggle (clears dislike) |
| `POST` | `/videos/:id/dislike` | ✅ Toggle (clears like) |
| `POST` | `/videos/:id/save` | ✅ |
| `POST` | `/videos/:id/report` | ✅ |
| `POST` | `/media/upload/:videoId` | ✅ (local `STORAGE_DRIVER` only, multipart) |
| `POST` | `/media/profile-upload` | ✅ Local avatar/banner PUT target |
| `POST` | `/media/podcast-upload` | ✅ Local podcast audio PUT target |
| `GET` | `/history` | ✅ |
| `POST` | `/history/progress` | ✅ |
| `DELETE` | `/history/clear` | ✅ |
| `DELETE` | `/history/:contentType/:contentId` | ✅ |
| `GET` | `/billing/products` | ✅ |
| `GET` | `/billing/gifts/catalog` | ✅ |
| `POST` | `/billing/stripe/create-checkout` | ✅ `productType: "coins"` or `"premium"`; dev mode grants without Stripe |
| `POST` | `/billing/stripe/webhook` | ✅ Stripe-signed — `checkout.session.completed`, `async_payment_succeeded` |
| `POST` | `/billing/stripe/fulfill` | ✅ Body `{ sessionId }` — verifies session `userId` |
| `GET` | `/billing/stripe/fulfill` | ✅ `?session_id=` — redirect fallback |
| `POST` | `/billing/subscriptions/create` | ✅ Channel membership `{ creatorId, tier }` |
| `GET` | `/billing/subscriptions/me` | ✅ |
| `DELETE` | `/billing/subscriptions/:id` | ✅ Cancel membership |
| `GET` | `/billing/creators/balance` | ✅ Available USD + pending payout rows |
| `POST` | `/billing/creators/payouts/request` | ✅ Min from `platform_settings.economy.minPayoutUsd` (default $50) |
| `POST` | `/billing/gifts/send` | ✅ (coins + `viewer_support` revenue split) |
| `POST` | `/streams/init` | ✅ Requires `streamer_status: approved` |
| `POST` | `/streams/mediamtx/auth` | ✅ MediaMTX HTTP auth (no Bearer) |
| `POST` | `/streams/webhooks/ready` | ✅ |
| `POST` | `/streams/webhooks/done` | ✅ |
| `GET` | `/streams/live` | ✅ |
| `GET` | `/streams/:id` | ✅ (UUID or creator `username`) |
| WS | `/streams` (Socket.IO) | ✅ `join`, `message`, `history` — Bearer in handshake |
| `GET` | `/podcasts/shows` | ✅ |
| `GET` | `/podcasts/shows/featured` | ✅ |
| `GET` | `/podcasts/shows/me` | ✅ Bearer — creator shows |
| `POST` | `/podcasts/shows` | ✅ |
| `GET` | `/podcasts/shows/:id` | ✅ |
| `POST` | `/podcasts/shows/:showId/episodes` | ✅ |
| `POST` | `/podcasts/episodes/:id/upload/init` | ✅ |
| `POST` | `/podcasts/episodes/:id/upload/complete` | ✅ |
| `GET` | `/podcasts/episodes/feed` | ✅ Optional JWT → `liked`, `saved` |
| `GET` | `/podcasts/episodes/:id` | ✅ Optional JWT → `liked`, `saved` |
| `POST` | `/podcasts/episodes/:id/play` | ✅ |
| `POST` | `/podcasts/episodes/:id/like` | ✅ Toggle |
| `POST` | `/podcasts/episodes/:id/save` | ✅ Toggle favorite |
| `GET` | `/playlists/discover` | ✅ Public playlists with items (sidebar/discover) |
| `GET` | `/playlists/me` | ✅ |
| `POST` | `/playlists` | ✅ |
| `PUT` | `/playlists/:id` | ✅ |
| `DELETE` | `/playlists/:id` | ✅ |
| `POST` | `/playlists/:id/items` | ✅ |
| `DELETE` | `/playlists/:id/items/:itemId` | ✅ |
| `PUT` | `/playlists/:id/reorder` | ✅ |
| `GET` | `/playlists/:id` | ✅ |
| `GET` | `/search` | ✅ |
| `GET` | `/search/suggest` | ✅ |
| `GET` | `/ads/serve` | ✅ Optional Bearer — premium users get `{ ad: null, adFree: true }` |
| `POST` | `/ads/track/impression` | ✅ |
| `POST` | `/ads/track/click` | ✅ |
| `POST` | `/analytics/track` | ✅ Optional JWT — batch `share`, `view`, etc. |
| `GET` | `/analytics/creators/me/dashboard` | ✅ |
| `GET` | `/analytics/creators/me/stats` | ✅ |
| `GET` | `/analytics/creators/me/content` | ✅ |
| `GET` | `/analytics/creators/stats` | ✅ (legacy) |
| `GET` | `/verticals` | ✅ Micro-drama series list |
| `GET` | `/verticals/:slug` | ✅ Series + episodes |
| `GET` | `/verticals/:slug/episodes/:episodeNumber` | ✅ Optional JWT — `liked`, `saved`, counters |
| `POST` | `/verticals/episodes/:episodeId/view` | ✅ Increment episode views |
| `POST` | `/verticals/episodes/:episodeId/like` | ✅ Toggle like |
| `POST` | `/verticals/episodes/:episodeId/save` | ✅ Toggle episode save |
| `POST` | `/verticals/series/:seriesId/save` | ✅ Toggle series save |
| `GET` | `/verticals/me/series` | ✅ Approved vertical creators only (Bearer) |
| `POST` | `/verticals/series` | ✅ Approved vertical creators only (Bearer) |
| `POST` | `/verticals/series/:slug/episodes` | ✅ Approved vertical creators only (Bearer) |
| `PUT` | `/verticals/episodes/:episodeId/video` | ✅ Approved vertical creators only (Bearer) |
| `GET` | `/programs` | ✅ Reads `platform_settings.programs` (admin-editable) |
| `GET` | `/programs/:slug` | ✅ Videos + `live_events` for pillar |
| `GET` | `/config/public` | ✅ Public ads knobs — shorts frequency, placement toggles, skip seconds |
| `GET` | `/admin/analytics/overview` | ✅ DAU, live, revenue today, pending queues |
| `GET` | `/admin/analytics/timeseries` | ✅ `?range=7d\|30d\|90d` — DAU, signups, revenue, live hours, top content |
| `GET` | `/admin/revenue-split-rules` | ✅ |
| `PUT` | `/admin/revenue-split-rules/:ruleKey` | ✅ Bps sum 10000 |
| `GET` | `/admin/reports` | ✅ `?status=&page=&limit=` |
| `GET` | `/admin/reports/:id` | ✅ Hydrated report |
| `PUT` | `/admin/reports/:id` | ✅ `{ action: dismiss \| delete_content \| ban_user, notes? }` |
| `GET` | `/admin/users` | ✅ `?q=&status=&type=&page=&limit=` |
| `GET` | `/admin/users/:id` | ✅ User detail + financial + reports |
| `GET` | `/admin/users/:id/impact` | ✅ `?periodMonth=YYYY-MM` — `creator_impact_snapshots` |
| `PUT` | `/admin/users/:id/impact` | ✅ Upsert impact scorecard for period |
| `PUT` | `/admin/users/:id/ban` | ✅ `{ banned }` |
| `PUT` | `/admin/users/:id/verify` | ✅ `{ verified }` |
| `PUT` | `/admin/users/:id/partner-tier` | ✅ `{ partnerTier }` |
| `PUT` | `/admin/users/:id/coins` | ✅ `{ delta }` |
| `GET` | `/admin/applications` | ✅ Unified queue — `?status=&type=streamer\|vertical\|all` |
| `GET` | `/admin/streamer-applications` | ✅ Legacy — prefer `/admin/applications` |
| `GET` | `/admin/streamer-applications/:id` | ✅ |
| `PUT` | `/admin/streamer-applications/:id` | ✅ `{ action: approve \| reject, notes? }` |
| `GET` | `/admin/vertical-creator-applications` | ✅ Legacy — prefer `/admin/applications` |
| `GET` | `/admin/vertical-creator-applications/:id` | ✅ |
| `PUT` | `/admin/vertical-creator-applications/:id` | ✅ `{ action: approve \| reject, notes? }` |
| `GET` | `/admin/payouts` | ✅ `?status=` |
| `PUT` | `/admin/payouts/:id` | ✅ `{ action: processing \| complete \| reject }` |
| `GET` | `/admin/live-streams` | ✅ |
| `GET` | `/admin/stream-history` | ✅ Ended streams |
| `GET` | `/admin/revenue/ledger` | ✅ Ledger batches (paginated) |
| `POST` | `/admin/streams/:id/kill` | ✅ |
| `DELETE` | `/admin/videos/:id` | ✅ |
| `DELETE` | `/admin/comments/:id` | ✅ |
| `GET` | `/admin/content/stats` | ✅ |
| `GET` | `/admin/content/videos` | ✅ `?type=short\|video\|movie` |
| `GET` | `/admin/content/comments` | ✅ |
| `GET` | `/admin/content/vertical-series` | ✅ |
| `GET` | `/admin/content/vertical-series/:slug/episodes` | ✅ |
| `GET` | `/admin/content/podcast-shows` | ✅ |
| `GET` | `/admin/content/podcast-shows/:showId/episodes` | ✅ |
| `DELETE` | `/admin/vertical-episodes/:id` | ✅ |
| `DELETE` | `/admin/podcast-episodes/:id` | ✅ |
| `GET` | `/admin/config/economy` | ✅ Pricing + coin/gift tables |
| `PUT` | `/admin/config/economy` | ✅ `minPayoutUsd`, premium/insider prices |
| `PUT` | `/admin/coin-packages` | ✅ Upsert package body |
| `DELETE` | `/admin/coin-packages/:id` | ✅ |
| `PUT` | `/admin/gift-catalog` | ✅ Upsert gift body |
| `DELETE` | `/admin/gift-catalog/:id` | ✅ Deactivate if in use |
| `GET` | `/admin/config/ads` | ✅ Network knobs + placements |
| `PUT` | `/admin/config/ads` | ✅ |
| `GET` | `/admin/config/analytics` | ✅ KPI visibility, alert thresholds |
| `PUT` | `/admin/config/analytics` | ✅ |
| `GET` | `/admin/config/scorecard` | ✅ Module progress + display prefs |
| `PUT` | `/admin/config/scorecard` | ✅ |
| `GET` | `/admin/config/programs` | ✅ Discovery category metadata |
| `PUT` | `/admin/config/programs` | ✅ `{ programs: [...] }` |
| `GET` | `/admin/economy/gifts` | ✅ Gift send activity |
| `GET` | `/admin/economy/transactions` | ✅ |
| `GET` | `/admin/ads/campaigns` | ✅ |
| `GET` | `/admin/ads/campaigns/:id` | ✅ |
| `POST` | `/admin/ads/campaigns` | ✅ |
| `PUT` | `/admin/ads/campaigns/:id/status` | ✅ `{ status }` |
| `PUT` | `/admin/ads/campaigns/:id` | 📋 Full edit |

---

## Planned API namespaces (Phase 2+)

| Prefix | Purpose |
|--------|---------|
| `/events` | Live events — tickets, schedule |
| `/stores` | Creator Store |
| `/support` | Tips, donations, super chats |
| `/gaf` | GAF ledger (admin) |
| `/insider` | Platform Insider $4.99/mo |
| `/advertisers` | B2B self-serve ads |
| `/sponsorships` | Brand ↔ creator deals |
| `/revenue` | Ledger queries |

---

## Root & health

### `GET /` ✅

Returns a short welcome string (under global prefix `/api/v1`).

### `GET /health` ✅

**Auth:** None

```json
{ "status": "ok", "timestamp": "2026-05-31T12:00:00.000Z" }
```

---

## Auth (`/auth`)

| Route | Status |
|-------|--------|
| `POST /auth/register` | ✅ |
| `POST /auth/login` | ✅ |
| `POST /auth/refresh` | ✅ Cookie `prysym_refresh` |
| `POST /auth/logout` | ✅ |
| `POST /auth/forgot-password` | ✅ Email via SMTP |
| `POST /auth/reset-password` | ✅ |
| `POST /auth/oauth/google` | 📋 Not in codebase yet |
| `POST /auth/oauth/apple` | 📋 Not in codebase yet |

Register/login response includes `accessToken`, `tokenType`, `expiresIn`, `user`. Sets HttpOnly refresh cookie on web.

---

## Users (`/users`)

All `/users/me/*` routes require Bearer auth.

| Route | Status | Notes |
|-------|--------|-------|
| `GET /users/me` | ✅ | Includes `partnerTier`, `programVerticals` when set |
| `PUT /users/me` | ✅ | `displayName`, `bio`, `avatarUrl`, `bannerUrl` |
| `POST /users/me/avatar/upload` | ✅ | `{ mimeType, fileName? }` → presigned PUT or local `POST /media/profile-upload` |
| `POST /users/me/banner/upload` | ✅ | Same as avatar |
| `POST /users/me/streamer-id/upload` | ✅ | `{ mimeType, fileName? }` → presigned PUT or local `POST /media/profile-upload` with `uploads/streamer-ids/{userId}.*` key |
| `GET/PUT /users/me/notification-preferences` | ✅ | |
| `PUT /users/me/social-links` | ✅ | `{ links: [{ label, url, sortOrder }] }` |
| `POST /users/apply-streamer` | ✅ | |
| `GET /users/me/videos` | ✅ | Paginated |
| `GET /users/me/saved` | ✅ | Resolves `video`, `movie`, `podcast_episode`, `vertical_episode`, `vertical_series` |
| `GET /users/me/liked` | ✅ | Resolves `video`, `podcast_episode`, `vertical_episode` |
| `GET /users/me/notifications` | ✅ | |
| `PUT /users/me/notifications/:id/read` | ✅ | |
| `PUT /users/me/notifications/read-all` | ✅ | |
| `DELETE /users/me/notifications` | ✅ | |
| `GET /users/:username` | ✅ | Public profile + `isLive`, `liveStreamId`, `isFollowing`, `isChannelMember`, `liveAlertsOn` |
| `GET /users/:username/playlists` | ✅ | Public playlists |
| `GET /users/:username/videos` | ✅ | `?page=&limit=` — public ready videos |
| `POST /users/:username/follow` | ✅ | |
| `DELETE /users/:username/follow` | ✅ | |
| `POST /users/:username/live-alerts` | ✅ | Toggle per-creator live notifications; subscribers get in-app `live` notification when stream goes live |

---

## Feed (`/feed`)

### `GET /feed/home` ✅

Aggregates: `liveNow`, `featuredLive`, `trending`, `newReleases`, `movies`, `featuredMovie`, `continueWatching` (when `Authorization` is sent — incomplete `video`, `podcast_episode`, and `vertical_episode` rows from `watch_history`). Guests still use client `localStorage` for vertical progress on home.

### `GET /feed/trending` ✅

**Query:** `page`, `limit`

---

## Videos (`/videos`)

| Route | Status |
|-------|--------|
| `POST /videos/upload/init` | ✅ `{ type, title, description?, category?, visibility?, tags?, mimeType, fileName? }` — **`type: movie` is admin-only**. |
| `POST /videos/upload/complete` | ✅ Verifies object, enqueues BullMQ `video-processing` job |
| `GET /videos/feed/shorts` | ✅ `?cursor=` — optional Bearer adds `liked`, `saved`, `disliked` per card |
| `GET /videos/feed/movies` | ✅ `?page=&limit=` |
| `GET /videos/feed/movies/featured` | ✅ |
| `GET /videos/:id` | ✅ Optional Bearer → `liked`, `saved`, `disliked`, `isFollowing`, `dislikesCount` |
| `POST /videos/:id/view` | ✅ Increment `viewsCount` (call on playback start) |
| `GET /videos/:id/comments` | ✅ `?page=&limit=` — optional Bearer → `liked` on each comment/reply |
| `POST /videos/:id/comments` | ✅ `{ body, parentId? }` |
| `POST /videos/comments/:commentId/like` | ✅ Toggle comment like |
| `POST /videos/:id/like` | ✅ Toggle (mutually exclusive with dislike) |
| `POST /videos/:id/dislike` | ✅ Toggle (mutually exclusive with like) |
| `POST /videos/:id/save` | ✅ Toggle |
| `POST /videos/:id/report` | ✅ `{ reason?, details? }` |

**Engagement model:** Likes and dislikes are stored in `likes` / `dislikes` tables with denormalized counters on `videos`. Comment likes use `likes` with `target_type: comment`.

---

## Media (`/media`)

| Route | Auth | When |
|-------|------|------|
| `POST /media/upload/:videoId` | Bearer | `STORAGE_DRIVER=local` — multipart video after `upload/init` |
| `POST /media/profile-upload` | Bearer | Local — avatar/banner/streamer ID after respective `POST /users/me/*/upload` |
| `POST /media/podcast-upload` | Bearer | Local — audio after `POST /podcasts/episodes/:id/upload/init` |

For S3/R2, clients use presigned PUT URLs from init endpoints instead of these routes.

---

## Video processing (BullMQ + FFmpeg)

After `POST /videos/upload/complete`, a job on queue `video-processing` runs in the API process (requires **Redis**).

| `VIDEO_PROCESSING_MODE` | Behavior |
|-------------------------|----------|
| `ffmpeg` | Download raw → multi-bitrate HLS (360p–1080p ladder) → JPEG thumbnail → update `hlsMasterUrl`, `thumbnailUrl`, `durationSeconds` → delete raw on S3 |
| `skip` | Raw file URL as playback; optional probe + thumbnail via FFmpeg |

**Requires:** `ffmpeg` and `ffprobe` on PATH (`FFMPEG_PATH`, `FFPROBE_PATH`).  
**Storage:** `STORAGE_DRIVER=local` (dev) or `s3` (Cloudflare R2-compatible). See [`how-to-run.md`](./how-to-run.md#7-video-uploads-r2--ffmpeg).

---

## History (`/history`) ✅

Bearer required.

| Route | Notes |
|-------|-------|
| `GET /history` | `?page=&limit=` — items include `video`, `podcastEpisode`, and/or `verticalEpisode` |
| `POST /history/progress` | `{ contentType, contentId, progressSeconds, completed }` — `contentType`: `video` \| `podcast_episode` \| `vertical_episode` |
| `DELETE /history/clear` | |
| `DELETE /history/:contentType/:contentId` | `video` \| `podcast_episode` \| `vertical_episode` |

---

## Billing (`/billing`)

| Route | Auth | Status |
|-------|------|--------|
| `GET /billing/products` | — | ✅ Coin packages from DB |
| `GET /billing/gifts/catalog` | — | ✅ |
| `POST /billing/gifts/send` | Bearer | ✅ Deducts coins, **`viewer_support`** split → creator balance |
| `POST /billing/stripe/create-checkout` | Bearer | ✅ `{ packageId, productType: "coins" \| "premium" }` |
| `POST /billing/stripe/webhook` | Stripe signature | ✅ `checkout.session.completed` + `async_payment_succeeded` |
| `POST` / `GET /billing/stripe/fulfill` | Bearer | ✅ Redirect fallback; verifies session `userId` |
| `POST /billing/subscriptions/create` | Bearer | ✅ `{ creatorId, tier: "basic" \| "premium" }` — 30-day channel membership ($4.99 / $9.99) |
| `GET /billing/subscriptions/me` | Bearer | ✅ Active creator memberships |
| `DELETE /billing/subscriptions/:id` | Bearer | ✅ Cancel (no refund; access until period end) |
| `GET /billing/creators/balance` | Bearer | ✅ Available + pending payout requests |
| `POST /billing/creators/payouts/request` | Bearer | ✅ `{ amountUsd, method: paypal\|bank_transfer\|crypto }` min $50 |

**Monetization V1 scope:** Platform Premium = site-wide ad-free. Channel membership = paid support for one creator (separate from free Follow). Payout fulfillment is manual until admin UI. See [`stripe-production.md`](./stripe-production.md).

**`POST /billing/gifts/send` body:**
```json
{
  "giftId": "heart",
  "receiverId": "uuid",
  "streamId": "optional-uuid",
  "videoId": "optional-uuid"
}
```

---

## Streams (`/streams`)

| Route | Status |
|-------|--------|
| `POST /streams/init` | ✅ `{ title, category? }` — requires `streamer_status: approved`; RTMP key + MediaMTX webhooks |
| `POST /streams/mediamtx/auth` | ✅ MediaMTX HTTP auth (no Bearer) |
| `POST /streams/webhooks/ready` | ✅ `?path=live/{streamKey}` — marks stream live; notifies `creator_live_alerts` subscribers |
| `POST /streams/webhooks/done` | ✅ Ends stream |
| `GET /streams/live` | ✅ All `live` streams |
| `GET /streams/:id` | ✅ By stream UUID **or** creator `username` (e.g. `progamerx`) |

### Live chat (WebSocket) ✅

**Namespace:** `/streams` (same host as API, no `/api/v1` prefix)  
**Auth:** `auth.token` or `Authorization` in Socket.IO handshake  

| Event | Direction | Payload |
|-------|-----------|---------|
| `join` | Client → Server | `{ streamId }` → server emits `history` |
| `message` | Client → Server | `{ streamId, message }` → broadcast `message` |
| `history` | Server → Client | Last ~80 messages |
| `message` | Server → Client | `{ id, streamId, userId, user, message, color, createdAt }` |

---

## Podcasts (`/podcasts`)

| Route | Auth | Status |
|-------|------|--------|
| `GET /podcasts/shows` | — | ✅ Paginated catalog |
| `GET /podcasts/shows/featured` | — | ✅ Hero / featured row |
| `GET /podcasts/shows/:id` | — | ✅ Show + episodes |
| `GET /podcasts/shows/me` | Bearer | ✅ Creator’s shows |
| `POST /podcasts/shows` | Bearer | ✅ `{ title, description?, coverUrl?, category? }` |
| `POST /podcasts/shows/:showId/episodes` | Bearer | ✅ Create episode shell |
| `POST /podcasts/episodes/:id/upload/init` | Bearer | ✅ Audio upload (R2 or local `POST /media/podcast-upload`) |
| `POST /podcasts/episodes/:id/upload/complete` | Bearer | ✅ ffprobe duration → `ready` |
| `GET /podcasts/episodes/feed` | Optional JWT | ✅ Latest episodes + `liked` / `saved` when authenticated |
| `GET /podcasts/episodes/:id` | Optional JWT | ✅ Episode + `liked` + `saved` when authenticated |
| `POST /podcasts/episodes/:id/play` | — | ✅ Increment plays |
| `POST /podcasts/episodes/:id/like` | Bearer | ✅ Toggle like |
| `POST /podcasts/episodes/:id/save` | Bearer | ✅ Toggle save (favorites) |

Frontend: `/podcasts` (API-only, no mocks), `/podcast/:id`, profile settings **Podcasts** for show/episode upload, `POST /history/progress` with `contentType: podcast_episode`.

---

## Playlists (`/playlists`)

| Route | Auth | Status |
|-------|------|--------|
| `GET /playlists/discover` | — | ✅ `?limit=` — public playlists sorted by item count |
| `GET /playlists/me` | Bearer | ✅ Owner’s playlists |
| `POST /playlists` | Bearer | ✅ `{ title, description?, type: video\|podcast\|mixed, visibility?, coverUrl? }` |
| `PUT /playlists/:id` | Bearer | ✅ Update metadata |
| `DELETE /playlists/:id` | Bearer | ✅ |
| `POST /playlists/:id/items` | Bearer | ✅ `{ itemType: video\|podcast_episode, itemId }` |
| `DELETE /playlists/:id/items/:itemId` | Bearer | ✅ |
| `PUT /playlists/:id/reorder` | Bearer | ✅ `{ itemIds: string[] }` playlist item row IDs |
| `GET /playlists/:id` | — | ✅ Playlist + ordered items (`playlistItemId` on each item) |
| `GET /users/:username/playlists` | — | ✅ Public playlists for profile |

Frontend: profile settings **Playlists**, `AddToPlaylistSheet` on watch + podcast pages.

---

## Search (`/search`)

### `GET /search` ✅

**Query:** `q`, `type` (`video` \| `creator` \| `podcast` \| `stream`), `page`

### `GET /search/suggest` ✅

**Query:** `q`

---

## Ads (`/ads`)

### `GET /ads/serve` ✅

**Query:** `placement` — `home_banner` \| `shorts_interstitial` \| `movie_preroll` \| **`vertical_episode`**

Returns `{ ad: ServedAd | null }` from active campaigns. With Bearer and active platform Premium: `{ ad: null, adFree: true }`.

### `POST /ads/track/impression` · `POST /ads/track/click` ✅

**Body:** `{ campaignId, creatorId, videoId?, placement, viewerUserId? }`

---

## Verticals — micro-dramas (`/verticals`)

9:16 episodic series. **Not** the same as `/programs` (founder content pillars).

| Route | Status |
|-------|--------|
| `GET /verticals` | ✅ `{ items: VerticalSeriesCard[] }` |
| `GET /verticals/:slug` | ✅ Series metadata + episode list |
| `GET /verticals/:slug/episodes/:episodeNumber` | ✅ Optional JWT — `liked`, `saved`, `viewsCount`, `likesCount` on episode; `saved` on series |
| `POST /verticals/episodes/:episodeId/view` | ✅ Increment episode `viewsCount` |
| `POST /verticals/episodes/:episodeId/like` | ✅ Bearer — toggle like |
| `POST /verticals/episodes/:episodeId/save` | ✅ Bearer — toggle episode save |
| `POST /verticals/series/:seriesId/save` | ✅ Bearer — toggle series save |
| `GET /verticals/me/series` | ✅ Bearer — **approved vertical creator** |
| `POST /verticals/series` | ✅ `{ slug, title, tagline?, description?, genre?, posterUrl? }` — approved only |
| `POST /verticals/series/:slug/episodes` | ✅ `{ episodeNumber, title, ... }` — approved only |
| `PUT /verticals/episodes/:episodeId/video` | ✅ `{ videoId }` — after upload; approved only |

**Vertical creator gate:** `POST /users/apply-vertical-creator` → admin `PUT /admin/vertical-creator-applications/:id` with `{ action: approve \| reject }`. User field: `verticalCreatorStatus` (`none` \| `pending` \| `approved` \| `rejected`). Dev auto-approve: `AUTO_APPROVE_VERTICAL_CREATOR=true`.

Frontend: show **`vertical_episode`** ad before each episode. Logged-in users persist progress via `POST /history/progress` (`contentType: vertical_episode`); guests use `localStorage`.

---

## Programs (`/programs`)

Founder pillars: Podcasts, Sports, Concerts, Community, Education. Consumer discovery: `/videos?category={slug}` (Sports, Concerts, etc.); Podcasts remain `/podcasts`.

| Route | Status |
|-------|--------|
| `GET /programs` | ✅ |
| `GET /programs/:slug` | ✅ Videos + `live_events` for that vertical |

## Categories (`/categories`)

Admin-managed taxonomies for uploads and browse filters. Stored in `platform_settings` (`programs`, `podcast_categories`).

| Route | Status |
|-------|--------|
| `GET /categories/videos` | ✅ Active video upload/browse categories (`general` + active programs except podcast hub) |
| `GET /categories/podcasts` | ✅ Active podcast show categories (labels used on `PodcastShow.category`) |

### `GET /videos/feed/videos` ✅

Long-form video browse (`type = video`). Returns live streams when `mode` includes live.

**Query:** `page`, `limit` (max 48), `vertical` (`general` \| `sports` \| `concert` \| `community_event` \| `education` \| …), `sort` (`views` \| `newest`), `mode` (`all` \| `videos` \| `live`), `q` (title search)

```json
{
  "videos": {
    "items": [ "…VideoCard with vertical…" ],
    "meta": { "page": 1, "limit": 24, "total": 42 }
  },
  "live": {
    "items": [
      {
        "contentType": "live",
        "id": "uuid",
        "slug": "creator_username",
        "title": "Stream title",
        "thumbnailUrl": null,
        "viewerCount": 120,
        "streamer": "Creator Name",
        "vertical": "sports"
      }
    ]
  }
}
```

---

## Analytics (`/analytics`)

| Route | Status |
|-------|--------|
| `POST /analytics/track` | ✅ Batch events — optional JWT (`share`, `view`, etc.) |
| `GET /analytics/creators/me/dashboard` | ✅ Impact dashboard |
| `GET /analytics/creators/me/stats` | ✅ |
| `GET /analytics/creators/me/content` | ✅ |
| `GET /analytics/creators/stats` | ✅ Legacy alias |

---

## Public config (`/config`)

**Auth:** None

| Route | Notes |
|-------|--------|
| `GET /config/public` | `{ ads: { shortsInterstitialEveryNSwipes, shortsInterstitialEnabled, shortsSkipSeconds, moviePrerollSkipSeconds, placements } }` — consumed by `/shorts` and ad UI |

Values are stored in `platform_settings` and edited at `/admin/config/ads`.

---

## Admin (`/admin`)

**Auth:** Bearer + role `admin` on all routes.

**Frontend:** Operator console at `/admin` (see [`admin-dashboard-plan.md`](./admin-dashboard-plan.md)).

### Analytics

| Route | Notes |
|-------|--------|
| `GET /admin/analytics/overview` | `{ dau, liveNow, liveViewers, revenueTodayUsd, pendingReports, pendingPayouts, pendingPayoutsUsd, pendingApplications, pendingStreamerApplications, pendingVerticalCreatorApplications }` |
| `GET /admin/analytics/timeseries` | `?range=7d\|30d\|90d` — daily buckets + `revenueBySource`, `topContent`, `premiumSubscribers` |

### Moderation, users, streamers, payouts, live

| Route | Notes |
|-------|--------|
| `GET/PUT /admin/reports`, `GET /admin/reports/:id` | Report queue + review actions |
| `GET /admin/users`, `GET /admin/users/:id` | Search, detail, tabs |
| `GET/PUT /admin/users/:id/impact` | Per-creator `creator_impact_snapshots` by `periodMonth` |
| `PUT /admin/users/:id/ban`, `/verify`, `/partner-tier`, `/coins` | User admin actions |
| `GET/PUT /admin/streamer-applications/:id` | Approve/reject streamer applications |
| `GET/PUT /admin/vertical-creator-applications/:id` | Approve/reject vertical series upload access |
| `GET/PUT /admin/payouts/:id` | Payout queue |
| `GET /admin/live-streams`, `GET /admin/stream-history` | Live + ended streams |
| `POST /admin/streams/:id/kill` | Force-end live stream |
| `GET /admin/revenue/ledger` | Revenue ledger batches |

### Content library

| Route | Notes |
|-------|--------|
| `GET /admin/content/stats` | Counts by type |
| `GET /admin/content/videos` | `?type=short\|video\|movie` |
| `GET /admin/content/comments` | |
| `GET /admin/content/vertical-series` (+ `/:slug/episodes`) | |
| `GET /admin/content/podcast-shows` (+ `/:showId/episodes`) | |
| `DELETE /admin/videos/:id`, `/comments/:id`, `/vertical-episodes/:id`, `/podcast-episodes/:id` | |

### Platform config (`platform_settings` + catalog tables)

| Route | Notes |
|-------|--------|
| `GET/PUT /admin/config/economy` | Min payout, premium/insider prices; GET includes coin packages + gifts |
| `PUT/DELETE /admin/coin-packages`, `/gift-catalog` | Catalog CRUD |
| `GET/PUT /admin/config/ads` | Skip timers, swipe frequency, placement toggles, GAF rule key |
| `GET/PUT /admin/config/analytics` | Dashboard KPI visibility, alert thresholds |
| `GET/PUT /admin/config/scorecard` | Mission module %, display prefs |
| `GET/PUT /admin/config/programs` | Video categories — add/edit/delete; drives `GET /programs`, `GET /categories/videos`, `/videos` chips, long-video upload |
| `GET/PUT /admin/config/podcast-categories` | Podcast categories — add/edit/delete; drives `GET /categories/podcasts`, `/podcasts` filters, podcast upload |

### Demo / sample content

Seeder flag `SEED_DEMO_CONTENT` (default `true` in dev, set `false` in `api/.env` for a clean catalog):

| Command | Effect |
|---------|--------|
| `SEED_DEMO_CONTENT=true` + `npm run db:seed` | Inserts demo user `progamerx` (live stream, movies, shorts, podcasts, vertical series) |
| `SEED_DEMO_CONTENT=false` + `npm run db:seed` | **Purges** demo content, then seeds admin + platform settings only |
| `npm run db:purge-demo` | Removes demo content without re-seeding |

**Important:** Setting `SEED_DEMO_CONTENT=false` alone does not delete rows already in the database — run `db:purge-demo` or `db:seed` once to clear them.

### Revenue, ads, economy activity

| Route | Notes |
|-------|--------|
| `GET/PUT /admin/revenue-split-rules/:ruleKey` | Bps must sum to 10000 |
| `GET/POST /admin/ads/campaigns`, `GET /admin/ads/campaigns/:id`, `PUT …/status` | Campaign CRUD |
| `GET /admin/economy/gifts`, `GET /admin/economy/transactions` | Activity feeds |

### Still planned

| Item | Notes |
|------|--------|
| `PUT /admin/ads/campaigns/:id` | Full campaign edit |
| CSV export | Analytics export |
| Admin audit log | |

**Seeded `revenue_split_rules` keys:** `live_event`, `viewer_support`, `insider_membership`, `ad_gaf_allocation`, `sponsorship`, `creator_subscription`, `coin_purchase`, `store_merchandise`

---

## Revenue & economy (DB ready — partial APIs)

Tables: `revenue_split_rules`, `revenue_ledger_*`, `gaf_*`, `viewer_support_transactions`, `live_events`, `creator_stores`, `platform_insider_subscriptions`, etc. Gifts use `RevenueSplitService` + `viewer_support` rule.

---

## Error format

```json
{
  "statusCode": 400,
  "message": ["validation error"],
  "error": "Bad Request"
}
```

---

## Environment variables

Templates: root [`.env.example`](../.env.example) (frontend + API reference) and [`api/.env.example`](../api/.env.example) (API-only). Copy to `.env.local` and `api/.env` respectively — **never commit** those files.

### API (`api/.env`)

| Variable | Required | Default (dev) | Notes |
|----------|----------|---------------|--------|
| `DATABASE_URL` | Yes | — | Postgres connection string |
| `REDIS_URL` | Yes | — | Redis connection string |
| `JWT_ACCESS_SECRET` | Yes | — | ≥32 chars; unique in production |
| `JWT_REFRESH_SECRET` | Yes | — | ≥32 chars; unique in production |
| `JWT_ACCESS_TTL` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_TTL` | No | `7d` | Refresh token lifetime |
| `API_PORT` | No | `4000` | HTTP listen port |
| `API_PUBLIC_URL` | Yes | — | Public API base, e.g. `http://localhost:4000/api/v1` — used for presigned/local upload URLs |
| `API_BUILD_ID` | No | — | Shown on `GET /health` |
| `CORS_ORIGIN` | Yes | — | Frontend origin, e.g. `http://localhost:3001` |
| `FRONTEND_URL` | Yes | — | Stripe success/cancel redirects, password-reset links |
| `NODE_ENV` | No | `development` | `development` \| `production` \| `test` |
| `STORAGE_DRIVER` | Yes | `local` | `local` or `s3` |
| `LOCAL_STORAGE_ROOT` | If `local` | `./storage` | Filesystem root for uploads |
| `LOCAL_STORAGE_PUBLIC_BASE_URL` | If `local` | — | Public URL prefix for served files |
| `MEDIA_STATIC_SERVE_PATH` | If `local` | `/api/v1/media/files` | Path segment for static file route |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | If `s3` | — | R2 / S3-compatible storage |
| `S3_REGION` | No | `auto` | S3 region |
| `STORAGE_RAW_KEY_PREFIX` | No | `uploads/raw` | Raw upload key prefix |
| `STORAGE_HLS_KEY_PREFIX` | No | `uploads/hls` | Processed HLS prefix |
| `STORAGE_THUMBNAIL_KEY_PREFIX` | No | `uploads/thumbnails` | Thumbnail prefix |
| `STORAGE_RAW_KEY_PATTERN` | No | `{videoId}/source{extension}` | Raw object key template |
| `STORAGE_PRESIGN_EXPIRES_SECONDS` | No | `3600` | Presigned URL TTL |
| `UPLOAD_MAX_BYTES` | No | `2147483648` | Max upload size (bytes) |
| `UPLOAD_ALLOWED_MIME_PREFIXES` | No | `video/,audio/` | Allowed MIME prefixes for video uploads |
| `VIDEO_PROCESSING_MODE` | No | `skip` | `ffmpeg` (HLS + thumb) or `skip` |
| `VIDEO_PROCESSING_MAX_RETRIES` | No | `3` | Worker retries |
| `FFMPEG_PATH`, `FFPROBE_PATH` | No | `ffmpeg`, `ffprobe` | Binaries when mode is `ffmpeg` |
| `VIDEO_PROCESSING_TMP_DIR` | No | — | Temp dir for transcodes |
| `RTMP_INGEST_URL` | No | `rtmp://localhost:1935/live` | RTMP server URL returned from `POST /streams/init` |
| `MEDIAMTX_HLS_PUBLIC_URL` | No | `http://localhost:8888` | Base URL for HLS playback (`{base}/live/{streamKey}/index.m3u8`) |
| `AUTO_APPROVE_STREAMER` | No | `false` | `true` / `1` in **non-production** only — skip admin queue for streamer applications (off by default) |
| `STRIPE_SECRET_KEY` | No | — | Empty → dev-mode instant coin/premium/membership grants |
| `STRIPE_WEBHOOK_SECRET` | No | — | Required with Stripe; see [`stripe-production.md`](./stripe-production.md) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | No | — | Password-reset email |

**Live stack:** `docker compose up -d mediamtx` exposes RTMP `:1935` and HLS `:8888`. MediaMTX calls `POST /streams/mediamtx/auth` and webhooks on the API (no Bearer). Run the API on the host so the container can reach `host.docker.internal:4000`.

**Profile images:** Avatar/banner use `POST /users/me/avatar/upload` and `/banner/upload`. With `STORAGE_DRIVER=local`, the client POSTs to `/media/profile-upload`; with `s3`, PUT to a presigned URL.

### Frontend (`.env.local`)

| Variable | Required | Default (dev) | Notes |
|----------|----------|---------------|--------|
| `NEXT_PUBLIC_API_URL` | Yes | — | e.g. `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_WS_URL` | No | derived from API | Socket.IO host only (no `/api/v1`) |
| `NEXT_PUBLIC_UPLOAD_MAX_BYTES` | No | — | Client-side upload guard; match API `UPLOAD_MAX_BYTES` |
| `NEXT_PUBLIC_MEDIA_PLACEHOLDER_URL` | No | — | Fallback image when thumbnails are empty |
| `NEXT_PUBLIC_DEFAULT_AVATAR_URL` | No | — | Overrides generated initials avatar |
| `NEXT_PUBLIC_RTMP_INGEST_URL` | No | `rtmp://localhost:1935/live` | Fallback RTMP label in Go Live if API omits `rtmpUrl` |

---

## Security notes

1. Access token in secure storage (mobile) or sessionStorage (web dev).
2. Web refresh: HttpOnly cookie + `credentials: 'include'` on `/auth/refresh`.
3. Rate limiting on all routes; stricter on auth.
4. Argon2id passwords; HTTPS + secure cookies in production.

---

## Reports (`/reports`) ✅

**Auth:** Bearer required. Same data model as `POST /videos/:id/report` (video-only shorthand).

| Route | Body |
|-------|------|
| `POST /reports` | `{ targetType: video \| stream \| user \| comment \| podcast_episode \| vertical_episode, targetId, reason, details? }` — `reason`: `spam` \| `nudity` \| `violence` \| `harassment` \| `other` |

---

*Last updated: 2026-05-31 — Full `/admin/*` operator APIs, `platform_settings` config, `GET /config/public`, `GET /admin/analytics/timeseries`, `GET/PUT /admin/users/:id/impact`. Production Stripe: [`stripe-production.md`](./stripe-production.md).*

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
| `POST` | `/auth/oauth/google` | 🚧 |
| `POST` | `/auth/oauth/apple` | 🚧 |
| `GET` | `/users/me` | ✅ |
| `PUT` | `/users/me` | ✅ |
| `GET` | `/users/me/notification-preferences` | ✅ |
| `PUT` | `/users/me/notification-preferences` | ✅ |
| `PUT` | `/users/me/social-links` | ✅ |
| `POST` | `/users/apply-streamer` | ✅ |
| `GET` | `/users/me/videos` | ✅ |
| `GET` | `/users/me/saved` | ✅ |
| `GET` | `/users/me/liked` | ✅ |
| `GET` | `/users/me/notifications` | ✅ |
| `PUT` | `/users/me/notifications/:id/read` | ✅ |
| `PUT` | `/users/me/notifications/read-all` | ✅ |
| `DELETE` | `/users/me/notifications` | ✅ |
| `GET` | `/users/:username` | ✅ |
| `POST` | `/users/:username/follow` | ✅ |
| `DELETE` | `/users/:username/follow` | ✅ |
| `GET` | `/feed/home` | ✅ |
| `GET` | `/feed/trending` | ✅ |
| `POST` | `/videos/upload/init` | ✅ |
| `POST` | `/videos/upload/complete` | ✅ |
| `GET` | `/videos/feed/shorts` | ✅ |
| `GET` | `/videos/feed/movies` | ✅ |
| `GET` | `/videos/feed/movies/featured` | ✅ |
| `GET` | `/videos/:id` | ✅ |
| `POST` | `/videos/:id/like` | ✅ |
| `POST` | `/videos/:id/save` | ✅ |
| `POST` | `/videos/:id/report` | ✅ |
| `POST` | `/media/upload/:videoId` | ✅ (local `STORAGE_DRIVER` only, multipart) |
| `GET` | `/history` | ✅ |
| `POST` | `/history/progress` | ✅ |
| `DELETE` | `/history/clear` | ✅ |
| `DELETE` | `/history/:contentType/:contentId` | ✅ |
| `GET` | `/billing/products` | ✅ |
| `GET` | `/billing/gifts/catalog` | ✅ |
| `POST` | `/billing/stripe/create-checkout` | 🚧 |
| `POST` | `/billing/gifts/send` | ✅ (coins + `viewer_support` revenue split) |
| `POST` | `/streams/init` | ✅ |
| `GET` | `/streams/live` | ✅ |
| `GET` | `/streams/:id` | ✅ (UUID or creator `username`) |
| `GET` | `/podcasts/shows` | ✅ |
| `GET` | `/podcasts/episodes/feed` | ✅ |
| `GET` | `/podcasts/episodes/:id` | ✅ |
| `GET` | `/playlists/:id` | ✅ |
| `GET` | `/search` | ✅ |
| `GET` | `/search/suggest` | ✅ |
| `GET` | `/ads/serve` | ✅ |
| `POST` | `/ads/track/impression` | ✅ |
| `POST` | `/ads/track/click` | ✅ |
| `POST` | `/analytics/track` | ✅ |
| `GET` | `/analytics/creators/me/dashboard` | ✅ |
| `GET` | `/analytics/creators/me/stats` | ✅ |
| `GET` | `/analytics/creators/me/content` | ✅ |
| `GET` | `/analytics/creators/stats` | ✅ (legacy) |
| `GET` | `/verticals` | ✅ Micro-drama series list |
| `GET` | `/verticals/:slug` | ✅ Series + episodes |
| `GET` | `/verticals/:slug/episodes/:episodeNumber` | ✅ Episode playback payload |
| `GET` | `/programs` | ✅ API only (no frontend hub) |
| `GET` | `/programs/:slug` | ✅ API only |
| `GET` | `/admin/analytics/overview` | 🚧 |
| `GET` | `/admin/revenue-split-rules` | ✅ |
| `PUT` | `/admin/revenue-split-rules/:ruleKey` | ✅ |
| `GET` | `/admin/ads/campaigns` | ✅ |
| `POST` | `/admin/ads/campaigns` | ✅ |
| `PUT` | `/admin/ads/campaigns/:id/status` | ✅ |

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
| `POST /auth/oauth/google` | 🚧 |
| `POST /auth/oauth/apple` | 🚧 |

Register/login response includes `accessToken`, `tokenType`, `expiresIn`, `user`. Sets HttpOnly refresh cookie on web.

---

## Users (`/users`)

All `/users/me/*` routes require Bearer auth.

| Route | Status | Notes |
|-------|--------|-------|
| `GET /users/me` | ✅ | Includes `partnerTier`, `programVerticals` when set |
| `PUT /users/me` | ✅ | `displayName`, `bio`, `avatarUrl`, `bannerUrl` |
| `GET/PUT /users/me/notification-preferences` | ✅ | |
| `PUT /users/me/social-links` | ✅ | `{ links: [{ label, url, sortOrder }] }` |
| `POST /users/apply-streamer` | ✅ | |
| `GET /users/me/videos` | ✅ | Paginated |
| `GET /users/me/saved` | ✅ | |
| `GET /users/me/liked` | ✅ | |
| `GET /users/me/notifications` | ✅ | |
| `PUT /users/me/notifications/:id/read` | ✅ | |
| `PUT /users/me/notifications/read-all` | ✅ | |
| `DELETE /users/me/notifications` | ✅ | |
| `GET /users/:username` | ✅ | Public profile + `isLive`, `liveStreamId` |
| `POST /users/:username/follow` | ✅ | |
| `DELETE /users/:username/follow` | ✅ | |

---

## Feed (`/feed`)

### `GET /feed/home` ✅

Aggregates: `liveNow`, `featuredLive`, `trending`, `newReleases`, `movies`, `featuredMovie`, `continueWatching` (empty until watch history wired).

### `GET /feed/trending` ✅

**Query:** `page`, `limit`

---

## Videos (`/videos`)

| Route | Status |
|-------|--------|
| `POST /videos/upload/init` | ✅ Presigned PUT (S3) or local multipart URL |
| `POST /videos/upload/complete` | ✅ Enqueues processing job |
| `GET /videos/feed/shorts` | ✅ `?cursor=` |
| `GET /videos/feed/movies` | ✅ `?page=&limit=` |
| `GET /videos/feed/movies/featured` | ✅ |
| `GET /videos/:id` | ✅ Full video + creator |
| `POST /videos/:id/like` | ✅ Toggle |
| `POST /videos/:id/save` | ✅ Toggle |
| `POST /videos/:id/report` | ✅ `{ reason?, details? }` |

---

## Media (`/media`)

### `POST /media/upload/:videoId` ✅

**Auth:** Bearer  
**Body:** `multipart/form-data` field `file`  
**Only when** `STORAGE_DRIVER=local`. For S3, use presigned PUT from upload/init.

---

## History (`/history`) ✅

Bearer required.

| Route | Notes |
|-------|-------|
| `GET /history` | `?page=&limit=` |
| `POST /history/progress` | `{ contentType, contentId, progressSeconds, completed }` |
| `DELETE /history/clear` | |
| `DELETE /history/:contentType/:contentId` | `video` \| `podcast_episode` |

---

## Billing (`/billing`)

| Route | Status |
|-------|--------|
| `GET /billing/products` | ✅ Coin packages from DB |
| `GET /billing/gifts/catalog` | ✅ |
| `POST /billing/gifts/send` | ✅ Deducts coins, records gift, **`viewer_support`** revenue split |
| `POST /billing/stripe/create-checkout` | 🚧 |

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
| `POST /streams/init` | ✅ Creates scheduled stream + stream key |
| `GET /streams/live` | ✅ All `live` streams |
| `GET /streams/:id` | ✅ By stream UUID **or** creator `username` (e.g. `progamerx`) |

---

## Podcasts (`/podcasts`)

| Route | Status |
|-------|--------|
| `GET /podcasts/shows` | ✅ |
| `GET /podcasts/episodes/feed` | ✅ |
| `GET /podcasts/episodes/:id` | ✅ |

---

## Playlists (`/playlists`)

### `GET /playlists/:id` ✅

Playlist + ordered items.

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

Returns `{ ad: ServedAd | null }` from active campaigns.

### `POST /ads/track/impression` · `POST /ads/track/click` ✅

**Body:** `{ campaignId, creatorId, videoId?, placement, viewerUserId? }`

---

## Verticals — micro-dramas (`/verticals`)

9:16 episodic series. **Not** the same as `/programs` (founder content pillars).

| Route | Status |
|-------|--------|
| `GET /verticals` | ✅ `{ items: VerticalSeriesCard[] }` |
| `GET /verticals/:slug` | ✅ Series metadata + episode list |
| `GET /verticals/:slug/episodes/:episodeNumber` | ✅ `{ series, episode, nextEpisode }` |

Frontend: show **`vertical_episode`** ad before playing the next episode.

---

## Programs (`/programs`)

Founder pillars: Podcasts, Sports, Concerts, Community, Education. **Backend only** — no `/programs` pages in the web app (use `/podcasts`, category feeds, etc.).

| Route | Status |
|-------|--------|
| `GET /programs` | ✅ |
| `GET /programs/:slug` | ✅ Videos + `live_events` for that vertical |

---

## Analytics (`/analytics`)

| Route | Status |
|-------|--------|
| `POST /analytics/track` | ✅ Batch events |
| `GET /analytics/creators/me/dashboard` | ✅ Impact dashboard |
| `GET /analytics/creators/me/stats` | ✅ |
| `GET /analytics/creators/me/content` | ✅ |
| `GET /analytics/creators/stats` | ✅ Legacy alias |

---

## Admin (`/admin`)

**Auth:** Bearer + role `admin`

| Route | Status |
|-------|--------|
| `GET /admin/analytics/overview` | 🚧 |
| `GET /admin/revenue-split-rules` | ✅ |
| `PUT /admin/revenue-split-rules/:ruleKey` | ✅ Bps must sum to 10000 |
| `GET /admin/ads/campaigns` | ✅ |
| `POST /admin/ads/campaigns` | ✅ |
| `PUT /admin/ads/campaigns/:id/status` | ✅ `{ status }` |

**Seeded rule keys:** `live_event`, `viewer_support`, `insider_membership`, `ad_gaf_allocation`, `sponsorship`, `creator_subscription`, `coin_purchase`, `store_merchandise`

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

## Security notes

1. Access token in secure storage (mobile) or sessionStorage (web dev).
2. Web refresh: HttpOnly cookie + `credentials: 'include'` on `/auth/refresh`.
3. Rate limiting on all routes; stricter on auth.
4. Argon2id passwords; HTTPS + secure cookies in production.

---

*Last updated: full route inventory — vertical series, programs, feed/streams/videos/billing/search implemented.*

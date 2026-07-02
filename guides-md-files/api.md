# Prysym TV — REST API Reference

**Base URL (development):** `http://localhost:4000/api/v1`  
**Base URL (production):** `https://srv1765056.hstgr.cloud/api/v1`  
**WebSocket host (no `/api/v1`):** same origin as API — e.g. `https://srv1765056.hstgr.cloud` (namespace `/streams`)  
**Auth:** Bearer access token in `Authorization: Bearer <accessToken>`. Refresh token in HttpOnly cookie `prysym_refresh` (path `/api/v1/auth`, 7-day TTL by default).  
**Content-Type:** `application/json` unless noted (multipart only on local-storage upload fallbacks).

> **React Native:** This doc includes a dedicated [React Native integration](#react-native-integration) section. The API is usable from mobile today; refresh tokens require cookie handling (see that section). There is no `refreshToken` field in JSON responses yet.

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
| `GET` | `/videos/feed/shorts` | ✅ `?cursor=&limit=` — optional JWT → `liked`, `saved`, `disliked`, `isFollowing` per card |
| `GET` | `/videos/feed/movies` | ✅ |
| `GET` | `/videos/feed/movies/featured` | ✅ |
| `GET` | `/videos/feed/videos` | ✅ Long-form browse — `vertical`, `sort`, `mode`, `page`, `limit`, `q` |
| `GET` | `/videos/:id/comments` | ✅ Optional JWT → each comment/reply includes `liked` |
| `POST` | `/videos/:id/comments` | ✅ Bearer; `{ body, parentId? }` |
| `POST` | `/videos/comments/:commentId/like` | ✅ Toggle comment like |
| `DELETE` | `/videos/comments/:commentId` | ✅ Author deletes own comment |
| `GET` | `/videos/:id` | ✅ Optional JWT → `liked`, `saved`, `disliked`, `isFollowing`, `dislikesCount` |
| `POST` | `/videos/:id/view` | ✅ Increment `viewsCount` on play |
| `POST` | `/videos/:id/like` | ✅ Toggle (clears dislike) |
| `POST` | `/videos/:id/dislike` | ✅ Toggle (clears like) |
| `POST` | `/videos/:id/save` | ✅ |
| `POST` | `/videos/:id/report` | ✅ |
| `PATCH` | `/videos/:id` | ✅ Bearer — owner edits title, description, visibility, etc. |
| `POST` | `/media/upload/:videoId` | ✅ (local `STORAGE_DRIVER` only, multipart) |
| `POST` | `/media/profile-upload` | ✅ Local avatar/banner PUT target |
| `POST` | `/media/podcast-upload` | ✅ Local podcast audio/video PUT target |
| `POST` | `/media/podcast-cover-upload` | ✅ Local podcast show cover PUT target |
| `POST` | `/media/ad-upload` | ✅ Local ad creative upload (admin) |
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
| `GET` | `/billing/creators/payout-profile` | ✅ Saved payout method + details (PayPal / bank / crypto) |
| `PUT` | `/billing/creators/payout-profile` | ✅ `{ method, details }` — required before requesting payouts |
| `POST` | `/billing/creators/payouts/request` | ✅ `{ amountUsd }` — uses saved profile; min from `platform_settings.economy.minPayoutUsd` (default $50) |
| `POST` | `/billing/gifts/send` | ✅ (coins + `viewer_support` revenue split) |
| `POST` | `/streams/init` | ✅ Requires `streamer_status: approved` |
| `GET` | `/streams/ingest/health` | ✅ Bearer — RTMP/HLS reachability for Go Live |
| `POST` | `/streams/mediamtx/auth` | ✅ MediaMTX HTTP auth (no Bearer) |
| `POST` | `/streams/webhooks/ready` | ✅ |
| `POST` | `/streams/webhooks/done` | ✅ |
| `GET` | `/streams/live` | ✅ |
| `POST` | `/streams/:id/end` | ✅ Bearer — stream owner ends broadcast; kicks RTMP + notifies viewers |
| `GET` | `/streams/:id` | ✅ (UUID or creator `username`); polls HLS fallback when webhook missed |
| WS | `/streams` (Socket.IO) | ✅ `join`, `message`, `history` — Bearer in handshake |
| `GET` | `/podcasts/shows` | ✅ |
| `GET` | `/podcasts/shows/featured` | ✅ |
| `GET` | `/podcasts/shows/trending` | ✅ `?limit=` — sorted by creator followers + latest episode |
| `GET` | `/podcasts/shows/me` | ✅ Bearer — creator shows |
| `POST` | `/podcasts/shows` | ✅ |
| `GET` | `/podcasts/shows/:id` | ✅ |
| `POST` | `/podcasts/shows/:id/cover/upload/init` | ✅ `{ mimeType, fileName? }` — presign or local cover |
| `POST` | `/podcasts/shows/:id/cover/upload/complete` | ✅ `{ objectKey }` — sets show `coverUrl` |
| `POST` | `/podcasts/shows/:showId/episodes` | ✅ |
| `POST` | `/podcasts/episodes/:id/upload/init` | ✅ |
| `POST` | `/podcasts/episodes/:id/upload/complete` | ✅ |
| `GET` | `/podcasts/episodes/feed` | ✅ Optional JWT → `liked`, `saved` |
| `GET` | `/podcasts/episodes/:id` | ✅ Optional JWT → `liked`, `saved` |
| `POST` | `/podcasts/episodes/:id/play` | ✅ |
| `PATCH` | `/podcasts/episodes/:id` | ✅ Bearer — owner edits episode metadata |
| `POST` | `/podcasts/episodes/:id/like` | ✅ Toggle |
| `POST` | `/podcasts/episodes/:id/dislike` | ✅ Toggle dislike |
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
| `GET` | `/ads/serve` | ✅ `?placement=&peek=1` — optional Bearer; `peek=1` returns ad without burning an impression |
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
| `POST` | `/verticals/episodes/:episodeId/dislike` | ✅ Toggle dislike |
| `POST` | `/verticals/episodes/:episodeId/save` | ✅ Toggle episode save |
| `POST` | `/verticals/series/:seriesId/save` | ✅ Toggle series save |
| `GET` | `/verticals/me/series` | ✅ Approved vertical creators only (Bearer) |
| `POST` | `/verticals/series` | ✅ Approved vertical creators only (Bearer) |
| `POST` | `/verticals/series/:slug/episodes` | ✅ Approved vertical creators only (Bearer) |
| `PUT` | `/verticals/episodes/:episodeId/video` | ✅ Approved vertical creators only (Bearer) |
| `PATCH` | `/verticals/episodes/:episodeId` | ✅ Creator edit episode metadata (Bearer, owner) |
| `DELETE` | `/verticals/episodes/:episodeId` | ✅ Creator delete episode (Bearer, owner) |
| `GET` | `/programs` | ✅ Reads `platform_settings.programs` (admin-editable) |
| `GET` | `/programs/:slug` | ✅ Videos + `live_events` for pillar |
| `GET` | `/categories/videos` | ✅ Video upload/browse categories |
| `GET` | `/categories/podcasts` | ✅ Podcast show categories |
| `GET` | `/categories/movies` | ✅ Movie genre list (admin-managed) |
| `GET` | `/config/public` | ✅ Public ads knobs — shorts frequency, placement toggles, skip seconds, `platformCreatorId` |
| `GET` | `/config/viewer-geo` | ✅ Server-resolved viewer city/region/country from request IP (for ad analytics fallback) |
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
| `GET` | `/admin/videos/:id` | ✅ Movie/video metadata for admin edit form |
| `PUT` | `/admin/videos/:id` | ✅ Update title, description, cast, tags, etc. (not video file) |
| `PUT` | `/admin/vertical-series/:slug` | ✅ Series metadata |
| `PUT` | `/admin/vertical-episodes/:id` | ✅ Episode metadata |
| `PUT` | `/admin/podcast-episodes/:id` | ✅ Episode metadata |
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
| `PUT` | `/admin/ads/campaigns/:id` | ✅ Full edit |
| `GET` | `/admin/ads/campaigns/:id/analytics` | ✅ Delivery, CTR, placement, click locations, timeline |
| `GET` | `/admin/config/movie-genres` | ✅ Movie genre taxonomy |
| `PUT` | `/admin/config/movie-genres` | ✅ `{ genres: [...] }` |
| `GET` | `/admin/config/podcast-categories` | ✅ Podcast category taxonomy |
| `PUT` | `/admin/config/podcast-categories` | ✅ `{ categories: [...] }` |
| `GET` | `/admin/analytics/revenue` | ✅ `?range=` revenue breakdown |
| `GET` | `/admin/analytics/content` | ✅ Top content by range |
| `GET` | `/admin/analytics/geography` | ✅ Viewer countries |
| `GET` | `/admin/analytics/export` | ✅ CSV export |
| `GET` | `/admin/audit-logs` | ✅ Admin action log |
| `GET` | `/admin/gaf/ledger` | ✅ GAF inflow/outflow |
| `GET` | `/admin/advertisers` | ✅ B2B advertiser accounts |
| `PUT` | `/admin/advertisers/:id` | ✅ Edit advertiser |
| `POST` | `/admin/advertisers/:id/verify` | ✅ Verify advertiser |
| `DELETE` | `/admin/advertisers/:id` | ✅ |
| `POST` | `/admin/ads/campaigns/:id/duplicate` | ✅ Clone campaign |
| `POST` | `/admin/ads/media/upload` | ✅ Ad creative upload init |
| `DELETE` | `/admin/ads/campaigns/:id` | ✅ |
| `DELETE` | `/admin/reports/:id` | ✅ |
| `DELETE` | `/admin/users/:id` | ✅ |
| `DELETE` | `/admin/streams/:id` | ✅ |
| `DELETE` | `/admin/podcast-shows/:id` | ✅ |
| `DELETE` | `/admin/vertical-series/:slug` | ✅ |
| `GET` | `/admin/vertical-series/:slug` | ✅ Admin series detail |
| `GET` | `/admin/vertical-episodes/:id` | ✅ Admin episode detail |
| `GET` | `/admin/podcast-episodes/:id` | ✅ Admin episode detail |
| `POST` | `/advertisers/register` | ✅ Bearer — create advertiser account |
| `GET` | `/advertisers/me` | ✅ Bearer — list own accounts |
| `GET` | `/advertisers/me/:id` | ✅ Bearer — account + campaigns |

---

## Planned API namespaces (Phase 2+)

| Prefix | Purpose |
|--------|---------|
| `/events` | Live events — tickets, schedule |
| `/stores` | Creator Store |
| `/support` | Tips, donations, super chats |
| `/gaf` | GAF ledger (admin — `GET /admin/gaf/ledger` exists) |
| `/insider` | Platform Insider $4.99/mo |
| `/sponsorships` | Brand ↔ creator deals |
| `/revenue` | Ledger queries |

---

## React Native integration

This section documents patterns for building the PrysymTV mobile app with React Native (Expo or bare workflow).

### Environment

| Variable | Example | Notes |
|----------|---------|-------|
| `API_BASE_URL` | `https://srv1765056.hstgr.cloud/api/v1` | All REST paths below are relative to this |
| `WS_URL` | `https://srv1765056.hstgr.cloud` | Socket.IO host — **no** `/api/v1` suffix |

Use HTTPS in production. For local dev against a machine IP, ensure `CORS_ORIGIN` on the API includes your Expo dev origin if needed.

### HTTP client setup

Recommended libraries: `fetch` (built-in) or `axios`, plus `expo-secure-store` / `react-native-keychain` for tokens.

**Every authenticated request:**

```http
Authorization: Bearer <accessToken>
Accept: application/json
Content-Type: application/json
```

**401 handling:** On `401`, call `POST /auth/refresh` once (singleton — avoid parallel refresh storms), then retry the original request. If refresh fails, clear session and show login.

### Authentication (critical for mobile)

Login and register responses:

```json
{
  "accessToken": "eyJ…",
  "tokenType": "Bearer",
  "expiresIn": "15m",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "handle",
    "role": "user"
  }
}
```

The **refresh token is not in the JSON body**. The API sets an HttpOnly cookie:

| Cookie | Path | TTL (default) | Purpose |
|--------|------|---------------|---------|
| `prysym_refresh` | `/api/v1/auth` | `JWT_REFRESH_TTL` (`7d`) | Rotating refresh session |

**Refresh flow:** `POST /auth/refresh` reads the cookie, revokes the old session, issues a new access token + new refresh cookie.

**Logout:** `POST /auth/logout` with the refresh cookie — revokes session server-side.

#### Cookie handling in React Native

The API does **not** yet accept `{ refreshToken }` in the request body. Mobile clients must persist the refresh cookie:

1. After `POST /auth/login` or `/auth/register`, read the `Set-Cookie` header and store `prysym_refresh` (e.g. `@react-native-cookies/cookies` `CookieManager.set`, or manual `Cookie` header on auth routes).
2. On `POST /auth/refresh` and `POST /auth/logout`, send `Cookie: prysym_refresh=<value>`.
3. After refresh, update stored cookie if the server rotates it (new `Set-Cookie`).

Store **`accessToken`** in secure storage (`expo-secure-store`, Keychain, EncryptedSharedPreferences). Default access TTL is **15 minutes** (`JWT_ACCESS_TTL`).

**Future improvement (not implemented):** return `refreshToken` in login JSON and accept it in `/auth/refresh` body for native clients. Until then, cookie persistence is required.

### Pagination conventions

| Pattern | Endpoints | Response shape |
|---------|-----------|----------------|
| **Page/limit** | Most feeds, lists, search | `{ items: [...], meta: { page, limit, total } }` |
| **Cursor** | `GET /videos/feed/shorts` | `{ items: [...], nextCursor: string \| null }` — cursor is numeric skip offset as string |

Default `limit` is typically 20–24; `GET /videos/feed/videos` max `limit` is 48.

### Video playback (HLS)

Movies, long-form videos, shorts, vertical episodes, and processed uploads expose **`hlsMasterUrl`** (or `playbackUrl` / `videoUrl` aliases on `VideoCard`). Use **`react-native-video`** with `source={{ uri: hlsMasterUrl, type: 'm3u8' }}`.

Live streams: `GET /streams/:id` returns `hlsPlaybackUrl` (MediaMTX HLS). Poll or use WebSocket `streamEnded` to detect end.

Podcasts: `mediaType: "audio"` → `audioUrl`; `mediaType: "video"` → `videoUrl` (HLS or direct URL after upload).

Call `POST /videos/:id/view` (or vertical/podcast play endpoints) when playback starts for analytics.

### File uploads (S3 / R2 production)

Standard 3-step flow for videos, podcast media, profile images, show covers:

1. **Init** — `POST …/upload/init` with `{ mimeType, fileName?, … }` → returns `UploadTarget`
2. **Upload** — `PUT` file bytes to `uploadUrl` with `uploadHeaders` (usually `Content-Type`)
3. **Complete** — `POST …/upload/complete` with `{ videoId \| objectKey, … }` → processing begins

**`UploadTarget` shape** (all init endpoints):

```json
{
  "objectKey": "uploads/raw/{videoId}/source.mp4",
  "uploadUrl": "https://…",
  "uploadMethod": "PUT",
  "uploadHeaders": { "Content-Type": "video/mp4" },
  "expiresIn": 3600,
  "maxUploadBytes": 2147483648
}
```

When `STORAGE_DRIVER=local` (dev), `uploadMethod` is `POST` to `/media/*` routes with multipart form + Bearer auth instead of presigned PUT.

**React Native upload tip:** use `fetch` PUT with `blob` from `expo-document-picker` / `expo-image-picker`, or `react-native-blob-util` for large files with progress.

### Live chat (Socket.IO)

```typescript
import { io } from 'socket.io-client';

const socket = io(`${WS_URL}/streams`, {
  auth: { token: accessToken },
  // or: extraHeaders: { Authorization: `Bearer ${accessToken}` },
  transports: ['websocket'],
});

socket.emit('join', { streamId });
socket.on('history', (messages) => { /* last ~80 */ });
socket.on('message', (msg) => { /* broadcast */ });
socket.on('gift', (gift) => { /* live gift animation */ });
socket.on('streamEnded', ({ streamId }) => { /* stop player */ });

socket.emit('message', { streamId, message: 'Hello' });
```

Anonymous connections are allowed (read-only chat); sending messages requires a valid JWT in the handshake.

### Push / in-app notification deep links

`GET /users/me/notifications` returns rows with `type`, `referenceId`, `actor`, `message`, `metadata`. Map to mobile screens using the same rules as the web app:

| `type` | Navigate when |
|--------|----------------|
| `follow` | Creator profile — `actor.username` → `/creator/:username` |
| `like`, `comment` | Use `metadata.videoType` + `metadata.videoId` or vertical/podcast fields |
| `upload` | New content from someone you follow |
| `live` | `referenceId` = stream UUID → live player |
| `gift` | `referenceId` = stream UUID if live gift; for video gifts, open creator profile or video context |
| `system` | Platform announcements |

**`metadata` fields:**

```typescript
type NotificationMetadata = {
  dedupeKey?: string;
  videoType?: 'short' | 'video' | 'movie';
  videoId?: string;
  commentId?: string;
  contentType?: 'video' | 'vertical_episode' | 'podcast_episode';
  seriesSlug?: string;
  episodeNumber?: number;
  podcastEpisodeId?: string;
};
```

**Screen mapping examples:**

| Web path | Mobile screen |
|----------|---------------|
| `/shorts?start={videoId}` | Shorts feed scrolled to video |
| `/watch/{videoId}` | Long-form player |
| `/movie/{videoId}` | Movie player |
| `/podcast/{episodeId}` | Podcast episode (audio or video) |
| `/verticals/watch/{slug}/{episodeNumber}` | Vertical episode player |
| `/live/{streamId}` | Live stream player |
| `/creator/{username}` | Creator profile |

### Ads on mobile

1. `GET /config/public` — read `ads.shortsInterstitialEveryNSwipes`, skip seconds, placement toggles
2. `GET /ads/serve?placement=…&peek=1` — check if ad exists without burning impression
3. Show preroll/interstitial/banner when `ad.mediaUrl` is non-empty
4. `POST /ads/track/impression` and `POST /ads/track/click` when shown/clicked
5. Premium users: send Bearer → `{ ad: null, adFree: true }`

Placements: `home_banner`, `movie_preroll`, `shorts_interstitial`, `vertical_episode`.

### Stripe checkout on mobile

`POST /billing/stripe/create-checkout` returns `{ url }` — open in **WebBrowser** / **SafariViewController** / Chrome Custom Tab. On success redirect, call `POST /billing/stripe/fulfill` with `{ sessionId }` or handle the `GET /billing/stripe/fulfill?session_id=` redirect.

Dev mode (no `STRIPE_SECRET_KEY`): coins/premium grant instantly without Stripe.

### Rate limits

Global default: `THROTTLE_LIMIT` requests per `THROTTLE_TTL_MS` per IP. Auth routes are stricter (e.g. login 10/min, register 5/min). Expect `429 Too Many Requests` — back off and retry.

### Recommended screen → API map

| App screen | Primary endpoints |
|------------|-------------------|
| Home | `GET /feed/home`, `GET /config/public`, `GET /ads/serve?placement=home_banner` |
| Shorts | `GET /videos/feed/shorts`, engagement POSTs, `GET /ads/serve?placement=shorts_interstitial` |
| Movies | `GET /videos/feed/movies`, `GET /videos/feed/movies/featured`, `GET /videos/:id` |
| Watch | `GET /videos/:id`, comments, like/save, `POST /history/progress` |
| Podcasts | `GET /podcasts/shows`, `/shows/trending`, `/episodes/feed`, `/episodes/:id` |
| Verticals | `GET /verticals`, `GET /verticals/:slug`, episode by number |
| Live | `GET /streams/live`, `GET /streams/:id`, Socket.IO `/streams` |
| Search | `GET /search`, `GET /search/suggest` |
| Profile | `GET /users/:username`, follow, gifts via `POST /billing/gifts/send` |
| Library | `GET /users/me/saved`, `GET /history`, playlists |
| Creator dashboard | `GET /analytics/creators/me/dashboard` |
| Settings | `GET/PUT /users/me`, notification prefs, payout profile |

---

## Root & health

### `GET /` ✅

Returns a short welcome string (under global prefix `/api/v1`).

### `GET /health` ✅

**Auth:** None

```json
{
  "status": "ok",
  "timestamp": "2026-06-19T12:00:00.000Z",
  "build": "production-20260622",
  "smtp": "ready",
  "storage": "s3",
  "videoProcessing": "ffmpeg"
}
```

| Field | Values | Notes |
|-------|--------|-------|
| `smtp` | `ready` \| `not_ready` | Password-reset email configured |
| `storage` | `local` \| `s3` | Active storage driver |
| `videoProcessing` | `ffmpeg` \| `skip` | Post-upload transcode mode |

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

Register/login response includes `accessToken`, `tokenType`, `expiresIn`, `user`. Sets HttpOnly refresh cookie `prysym_refresh` (not returned in JSON — see [React Native integration](#react-native-integration)).

**Register body:** `{ email, username, password, displayName? }`  
**Login body:** `{ email, password }` (email field accepts username or email)  
**Forgot password:** `{ email }` → always `{ success: true }` (no email enumeration)  
**Reset password:** `{ token, newPassword }` — token from email link; revokes all refresh sessions

**Refresh response:** same shape as login (`accessToken`, `expiresIn`, `user`) + new refresh cookie.

**Auth rate limits (per IP):** register 5/min, login 10/min, refresh 30/min, forgot/reset 5/min.

---

## Users (`/users`)

All `/users/me/*` routes require Bearer auth.

| Route | Status | Notes |
|-------|--------|-------|
| `GET /users/me` | ✅ | Full profile — see [User type](#user-get-usersme) |
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
| `GET /users/me/notifications` | ✅ | Paginated in-app feed (`type`, `message`, `actor`, `referenceId`, `isRead`) |
| `PUT /users/me/notifications/:id/read` | ✅ | |
| `PUT /users/me/notifications/read-all` | ✅ | |
| `DELETE /users/me/notifications` | ✅ | Clear all |

Notifications include optional `metadata` for deep links and deduplication:

```typescript
type NotificationMetadata = {
  dedupeKey?: string;
  videoType?: 'short' | 'video' | 'movie';
  videoId?: string;
  commentId?: string;
  contentType?: 'video' | 'vertical_episode' | 'podcast_episode';
  seriesSlug?: string;
  episodeNumber?: number;
  podcastEpisodeId?: string;
};
```

See [React Native integration — deep links](#push--in-app-notification-deep-links) for screen routing. Like notifications use `dedupeKey` so unlike → like again does **not** re-notify.

**Notification triggers** (respect `GET/PUT /users/me/notification-preferences`; default all on):

| Pref `type` | Created when |
|-------------|----------------|
| `follow` | Someone follows you |
| `like` | Someone likes your video or your comment |
| `comment` | Someone comments on your video or replies to your comment |
| `gift` | Someone sends you a gift (live stream, video, shorts, or profile) |
| `live` | A creator you subscribed to (live-alerts bell) goes live |
| `upload` | Someone you follow publishes a new public video (processing → `ready`) |
| `system` | Reserved for platform announcements (admin) |
| `GET /users/:username` | ✅ | Public profile + `isLive`, `liveStreamId`, `isFollowing`, `isChannelMember`, `liveAlertsOn` |
| `GET /users/:username/playlists` | ✅ | Public playlists |
| `GET /users/:username/videos` | ✅ | `?page=&limit=` — public ready videos |
| `POST /users/:username/follow` | ✅ | |
| `DELETE /users/:username/follow` | ✅ | |
| `POST /users/:username/live-alerts` | ✅ | Toggle per-creator live notifications; subscribers get in-app `live` notification when stream goes live |

---

## Feed (`/feed`)

### `GET /feed/home` ✅

**Auth:** Optional Bearer — when sent, includes personalized `continueWatching`.

Aggregates:

| Key | Source / algorithm |
|-----|-------------------|
| `liveNow` | Up to 12 live streams by `viewerCount` desc |
| `featuredLive` | First item from `liveNow` |
| `trending` | Public `video` + `short` by `viewsCount` desc (16 items) |
| `newReleases` | Public **movies** by `createdAt` desc (8 items) — **not** the same list as `movies` |
| `movies` | Public **movies** by `viewsCount` desc (12 items) — “Top Movies” |
| `featuredMovie` | Newest ready movie by `createdAt` |
| `continueWatching` | Incomplete `watch_history` for authenticated user (`video`, `podcast_episode`, `vertical_episode`) |

Guests: no `continueWatching` from API (web uses `localStorage` for vertical progress only).

### `GET /feed/trending` ✅

**Query:** `page`, `limit`

---

## Videos (`/videos`)

| Route | Status |
|-------|--------|
| `POST /videos/upload/init` | ✅ `{ type, title, description?, category?, visibility?, tags?, mimeType, fileName? }` — **`type: movie` is admin-only** |
| `POST /videos/upload/complete` | ✅ `{ videoId, objectKey? }` — verifies object, enqueues BullMQ `video-processing` job |
| `GET /videos/feed/shorts` | ✅ `?cursor=&limit=` — optional Bearer adds `liked`, `saved`, `disliked`, **`isFollowing`** per card |
| `GET /videos/feed/movies` | ✅ `?page=&limit=` |
| `GET /videos/feed/movies/featured` | ✅ |
| `GET /videos/:id` | ✅ Optional Bearer → `liked`, `saved`, `disliked`, `isFollowing`, `dislikesCount` |
| `POST /videos/:id/view` | ✅ Increment `viewsCount` (call on playback start) |
| `GET /videos/:id/comments` | ✅ `?page=&limit=` — optional Bearer → `liked` on each comment/reply |
| `POST /videos/:id/comments` | ✅ `{ body, parentId? }` — notifies video owner (`comment` pref) or parent author on reply |
| `POST /videos/comments/:commentId/like` | ✅ Toggle comment like — notifies comment author (`like` pref) |
| `DELETE /videos/comments/:commentId` | ✅ Bearer — author deletes own comment (replies removed if top-level) |
| `POST /videos/:id/like` | ✅ Toggle (mutually exclusive with dislike) — notifies video owner (`like` pref) |
| `POST /videos/:id/dislike` | ✅ Toggle (mutually exclusive with like) |
| `POST /videos/:id/save` | ✅ Toggle |
| `POST /videos/:id/report` | ✅ `{ reason?, details? }` |
| `PATCH /videos/:id` | ✅ Bearer — owner updates title, description, visibility, tags, etc. |

**`POST /videos/upload/init` response:**

```json
{
  "videoId": "uuid",
  "status": "processing",
  "objectKey": "uploads/raw/{videoId}/source.mp4",
  "uploadUrl": "https://…",
  "uploadMethod": "PUT",
  "uploadHeaders": { "Content-Type": "video/mp4" },
  "maxUploadBytes": 2147483648,
  "expiresIn": 3600
}
```

**Engagement model:** Likes and dislikes are stored in `likes` / `dislikes` tables with denormalized counters on `videos`. Comment likes use `likes` with `target_type: comment`.

---

## Media (`/media`)

| Route | Auth | When |
|-------|------|------|
| `POST /media/upload/:videoId` | Bearer | `STORAGE_DRIVER=local` — multipart video after `upload/init` |
| `POST /media/profile-upload` | Bearer | Local — avatar/banner/streamer ID after respective `POST /users/me/*/upload` |
| `POST /media/podcast-upload` | Bearer | Local — podcast **audio or video** after `POST /podcasts/episodes/:id/upload/init` |
| `POST /media/podcast-cover-upload` | Bearer | Local — show cover after `POST /podcasts/shows/:id/cover/upload/init` |
| `POST /media/ad-upload` | Bearer (admin) | Local — ad creative after `POST /admin/ads/media/upload` |

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
| `POST /billing/gifts/send` | Bearer | ✅ Deducts coins, **`viewer_support`** split → creator balance; in-app `gift` notification to receiver |
| `POST /billing/stripe/create-checkout` | Bearer | ✅ `{ packageId, productType: "coins" \| "premium" }` |
| `POST /billing/stripe/webhook` | Stripe signature | ✅ `checkout.session.completed` + `async_payment_succeeded` |
| `POST` / `GET /billing/stripe/fulfill` | Bearer | ✅ Redirect fallback; verifies session `userId` |
| `POST /billing/subscriptions/create` | Bearer | ✅ `{ creatorId, tier: "basic" \| "premium" }` — 30-day channel membership ($4.99 / $9.99) |
| `GET /billing/subscriptions/me` | Bearer | ✅ Active creator memberships |
| `DELETE /billing/subscriptions/:id` | Bearer | ✅ Cancel (no refund; access until period end) |
| `GET /billing/creators/balance` | Bearer | ✅ Available + pending payout requests |
| `GET /billing/creators/payout-profile` | Bearer | ✅ `{ method, details, updatedAt }` or `null` |
| `PUT /billing/creators/payout-profile` | Bearer | ✅ `{ method: paypal\|bank_transfer\|crypto, details: { ... } }` |
| `POST /billing/creators/payouts/request` | Bearer | ✅ `{ amountUsd }` — snapshots saved profile into payout row; min $50 |

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
| `GET /streams/ingest/health` | ✅ Bearer — `{ rtmp, hls, mediamtx }` for Go Live diagnostics |
| `POST /streams/mediamtx/auth` | ✅ MediaMTX HTTP auth (no Bearer) |
| `POST /streams/webhooks/ready` | ✅ `?path=live/{streamKey}` — marks stream live; notifies `creator_live_alerts` subscribers |
| `POST /streams/webhooks/done` | ✅ Ends stream |
| `GET /streams/live` | ✅ All `live` streams |
| `POST /streams/:id/end` | ✅ Bearer — owner ends stream; disconnects publisher via MediaMTX API; Socket.IO `streamEnded` to room |
| `GET /streams/:id` | ✅ By stream UUID **or** creator `username`; if HLS playlist exists but webhook missed, syncs to `live` |

### Live chat (WebSocket) ✅

**Namespace:** `/streams` (same host as API, no `/api/v1` prefix)  
**Auth:** `auth.token` or `Authorization` in Socket.IO handshake  

| Event | Direction | Payload |
|-------|-----------|---------|
| `join` | Client → Server | `{ streamId }` → server emits `history` |
| `message` | Client → Server | `{ streamId, message }` → broadcast `message` |
| `history` | Server → Client | Last ~80 messages |
| `message` | Server → Client | `{ id, streamId, userId, user, message, color, createdAt }` |
| `gift` | Server → Client | Live gift animation — see payload below |
| `streamEnded` | Server → Client | `{ streamId }` — broadcast ended; stop player and show offline |

**`gift` event payload** (when `POST /billing/gifts/send` includes `streamId`):

```json
{
  "id": "gift-uuid",
  "streamId": "stream-uuid",
  "userId": "sender-uuid",
  "user": "Display Name",
  "giftId": "heart",
  "giftName": "Heart",
  "giftIcon": "heart",
  "coins": 50,
  "color": "text-pink-400",
  "createdAt": "2026-06-19T12:00:00.000Z"
}
```

Gifts on videos/shorts/profile do **not** emit WebSocket events — only in-app `gift` notification to the receiver.

---

## Podcasts (`/podcasts`)

Supports **audio and video** podcast episodes. Episode objects include `mediaType` (`audio` \| `video`), `audioUrl`, and `videoUrl` (one populated based on type).

| Route | Auth | Status |
|-------|------|--------|
| `GET /podcasts/shows` | — | ✅ Paginated catalog |
| `GET /podcasts/shows/featured` | — | ✅ Hero / featured row |
| `GET /podcasts/shows/trending` | — | ✅ `?limit=` — by creator followers + latest episode |
| `GET /podcasts/shows/:id` | — | ✅ Show + episodes |
| `GET /podcasts/shows/me` | Bearer | ✅ Creator’s shows |
| `POST /podcasts/shows` | Bearer | ✅ `{ title, description?, coverUrl?, category? }` |
| `POST /podcasts/shows/:id/cover/upload/init` | Bearer | ✅ `{ mimeType, fileName? }` — image cover |
| `POST /podcasts/shows/:id/cover/upload/complete` | Bearer | ✅ `{ objectKey }` |
| `POST /podcasts/shows/:showId/episodes` | Bearer | ✅ Create episode shell |
| `POST /podcasts/episodes/:id/upload/init` | Bearer | ✅ `{ mimeType, fileName? }` — **audio** (`audio/*`) or **video** (`video/*`); R2 presign or local `POST /media/podcast-upload` |
| `POST /podcasts/episodes/:id/upload/complete` | Bearer | ✅ ffprobe duration → `ready`; sets `mediaType`, `audioUrl` or `videoUrl` |
| `GET /podcasts/episodes/feed` | Optional JWT | ✅ Latest episodes + `liked` / `saved` / `disliked` when authenticated |
| `GET /podcasts/episodes/:id` | Optional JWT | ✅ Episode + engagement flags when authenticated |
| `POST /podcasts/episodes/:id/play` | — | ✅ Increment plays |
| `PATCH /podcasts/episodes/:id` | Bearer | ✅ Owner updates title, description, etc. |
| `POST /podcasts/episodes/:id/like` | Bearer | ✅ Toggle like |
| `POST /podcasts/episodes/:id/dislike` | Bearer | ✅ Toggle dislike |
| `POST /podcasts/episodes/:id/save` | Bearer | ✅ Toggle save (favorites) |

**Episode response fields (playback):**

```json
{
  "id": "uuid",
  "title": "Episode title",
  "mediaType": "video",
  "audioUrl": null,
  "videoUrl": "https://cdn…/episode.m3u8",
  "durationSeconds": 3600,
  "liked": false,
  "saved": false,
  "disliked": false
}
```

Mobile: use `react-native-video` for `mediaType: "video"`; use audio player (e.g. `expo-av` TrackPlayer) for `mediaType: "audio"`.

Frontend reference: `/podcasts` browse, `/podcast/:id` player, `POST /history/progress` with `contentType: podcast_episode`.

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
| `PUT /playlists/:id/reorder` | Bearer | ✅ `{ items: [{ id, sortOrder }] }` — playlist item row IDs |
| `GET /playlists/:id` | — | ✅ Playlist + ordered items (`playlistItemId` on each item). Prunes orphaned rows (deleted video/episode). `itemCount` = resolvable items only. |
| `GET /users/:username/playlists` | — | ✅ Public playlists; `itemCount` counts only items whose content still exists |

**Item counts:** List endpoints count playlist rows whose `video` or `podcast_episode` still exists. Deleting content removes playlist references (admin video/episode delete). `GET /playlists/:id` auto-prunes stale rows on load.

Frontend: profile settings **Playlists**, `AddToPlaylistSheet` on watch + podcast pages.

---

## Search (`/search`)

### `GET /search` ✅

**Query:** `q`, `type` (`video` \| `creator` \| `podcast` \| `stream`), `page`

### `GET /search/suggest` ✅

**Query:** `q`

---

## Ads (`/ads`)

### Placements (one campaign pool per placement)

| Placement | Where it runs | When `GET /ads/serve` is called |
|-----------|---------------|----------------------------------|
| `home_banner` | Home page sponsored strip | Once when `AdBanner` mounts |
| `movie_preroll` | Before movie playback | When user starts a movie (`AdPreroll`) |
| `shorts_interstitial` | Full-screen between Shorts | Every N swipes (`shortsInterstitialEveryNSwipes` from `GET /config/public`; default 5) |
| `vertical_episode` | Before vertical episode plays | After `peek=1` confirms a playable ad (`VerticalEpisodeAdGate`) |

Each placement is independent: a `home_banner` campaign never competes with a `movie_preroll` campaign. Admin can disable a placement globally via `GET/PUT /admin/config/ads` → `placements.{placement}`.

Premium users (active platform subscription): `GET /ads/serve` returns `{ ad: null, adFree: true }` when Bearer is sent.

Clients call `GET /ads/serve?placement=…&peek=1` before showing preroll/interstitial/vertical gates. If `{ ad: null }` or `mediaUrl` is empty, skip the ad UI. The real serve (without `peek`) burns an impression when the ad is shown.

### `GET /ads/serve` ✅ — how a campaign is picked

**Query:** `placement` — `home_banner` \| `shorts_interstitial` \| `movie_preroll` \| `vertical_episode` · optional `peek=1` (or `peek=true`) — return eligible ad **without** incrementing `deliveredImpressions`

**Selection algorithm** (same for all placements):

1. **Filter eligible campaigns** for that `placement` where:
   - `status = active`
   - `startsAt ≤ now ≤ endsAt`
   - `mediaUrl` is non-empty (playable creative)
   - `deliveredImpressions < targetImpressions`
   - estimated spend `(deliveredImpressions × CPM / 1000) < budgetUsd`
2. If none eligible → `{ ad: null }`
3. **Weighted random pick** among eligible campaigns:
   - weight = `targetImpressions - deliveredImpressions` (remaining delivery quota)
   - campaigns with more remaining impressions are more likely to be chosen, but each request is **random** (not round-robin, not strict budget order)
4. Unless `peek=1`, **increment** `deliveredImpressions` on the picked campaign immediately (counts as “served”)
5. If served count ≥ target **or** estimated spend ≥ budget → set campaign `status = completed`

So with multiple home banners: **each page load / serve call** rolls weighted random among active campaigns that still have budget and impression cap left. Refreshing can show a different ad. This is **not** pure random equal odds — campaigns closer to their target get lower weight.

**Response:** `{ ad: ServedAd | null }` where `ServedAd` includes `id`, `title`, `mediaUrl`, `clickThroughUrl`, `placement`, `mediaType` (`image` \| `video`), `skipAfterSeconds` (preroll/shorts/vertical only).

### `POST /ads/track/impression` · `POST /ads/track/click` ✅

**Body:**

```json
{
  "campaignId": "uuid",
  "creatorId": "uuid?",
  "videoId": "uuid?",
  "placement": "home_banner",
  "viewerUserId": "uuid?",
  "viewerGeo": {
    "city": "Newark?",
    "region": "NJ?",
    "regionName": "New Jersey?",
    "countryCode": "US?"
  }
}
```

- `creatorId` optional (falls back to platform admin user).
- `videoId` optional — must be a **`videos.id` UUID** when set (do not pass vertical `seriesId`; omit for vertical-episode placements).
- **Serve** increments `deliveredImpressions` (unless `peek=1`); **track/impression** records `content_ad_events` + analytics (player pixel).
- **track/click** increments `clicks` and stores click location in event `metadata.location`.
- **Geo:** Server resolves city/region from client IP (or Cloudflare `CF-IPCity` / `CF-Region` headers). If IP is private (localhost), optional `viewerGeo` from the browser is used as fallback. Signed-in users without geo may fall back to profile `countryCode`.

**Admin analytics:** `GET /admin/ads/campaigns/:id/analytics` — delivery %, CTR, guest vs signed-in, by placement, **click locations** (`byLocation`), 30-day timeline, recent events.

### Advertisers B2B (`/advertisers`) ✅

| Route | Auth | Notes |
|-------|------|--------|
| `POST /advertisers/register` | Bearer | Create advertiser account |
| `GET /advertisers/me` | Bearer | List own accounts |
| `GET /advertisers/me/:id` | Bearer | Account + campaigns |

Frontend: `/advertisers` self-serve portal. Admin: `/admin/advertisers`, `/admin/gaf`, `/admin/audit-log`.

### Admin ads (extended) ✅

| Route | Notes |
|-------|--------|
| `PUT /admin/ads/campaigns/:id` | Full edit incl. `revenueRuleKey`, `advertiserAccountId` |
| `POST /admin/ads/campaigns/:id/duplicate` | Clone campaign |
| `POST /admin/ads/media/upload` | Ad creative upload |
| `GET /admin/ads/campaigns` | Filters: `status`, `placement`, `q`, date range |
| `GET /admin/ads/campaigns/:id/analytics` | Performance tab: delivery, CTR, audience, placements, click geography, timeline |

Platform ads config adds `impressionRevenueCpmUsd`. `GET /config/public` includes `platformCreatorId` + `placements`.

### Analytics (extended) ✅

| Route | Notes |
|-------|--------|
| `POST /analytics/track` | Batch events; header `X-Country-Code` for geography |
| `GET /admin/analytics/revenue` | Revenue breakdown by range |
| `GET /admin/analytics/content` | Top content, likes, dislikes by range |
| `GET /admin/analytics/geography` | Viewer countries from event metadata |
| `GET /admin/analytics/export` | CSV export |
| `GET /admin/gaf/ledger` | GAF inflow/outflow |
| `GET /admin/audit-logs` | Admin action log |

`POST /videos/:id/view` writes `analytics_events` (view). Trending feed uses 7-day views. Creator dashboard: `GET /analytics/creators/me/dashboard`.

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
| `POST /verticals/episodes/:episodeId/dislike` | ✅ Bearer — toggle dislike |
| `POST /verticals/episodes/:episodeId/save` | ✅ Bearer — toggle episode save |
| `POST /verticals/series/:seriesId/save` | ✅ Bearer — toggle series save |
| `GET /verticals/me/series` | ✅ Bearer — **approved vertical creator** |
| `POST /verticals/series` | ✅ `{ slug, title, tagline?, description?, genre?, posterUrl? }` — approved only |
| `POST /verticals/series/:slug/episodes` | ✅ `{ episodeNumber, title, ... }` — approved only |
| `PUT /verticals/episodes/:episodeId/video` | ✅ `{ videoId }` — after upload; approved only |
| `PATCH /verticals/episodes/:episodeId` | ✅ Bearer — owner: `{ episodeNumber?, title?, description?, cliffhanger? }` |
| `DELETE /verticals/episodes/:episodeId` | ✅ Bearer — owner; updates series `totalEpisodes` |

**Vertical creator gate:** `POST /users/apply-vertical-creator` → admin `PUT /admin/vertical-creator-applications/:id` with `{ action: approve \| reject }`. User field: `verticalCreatorStatus` (`none` \| `pending` \| `approved` \| `rejected`). Dev auto-approve: `AUTO_APPROVE_VERTICAL_CREATOR=true`.

Frontend: **`peek=1`** then show **`vertical_episode`** ad only when a playable creative exists. Logged-in users persist progress via `POST /history/progress` (`contentType: vertical_episode`); guests use `localStorage`.

---

## Programs (`/programs`)

Founder pillars: Podcasts, Sports, Concerts, Community, Education. Consumer discovery: `/videos?category={slug}` (Sports, Concerts, etc.); Podcasts remain `/podcasts`.

| Route | Status |
|-------|--------|
| `GET /programs` | ✅ |
| `GET /programs/:slug` | ✅ Videos + `live_events` for that vertical |

## Categories (`/categories`)

Admin-managed taxonomies for uploads and browse filters. Stored in `platform_settings` (`programs`, `podcast_categories`, `movie_genres`).

| Route | Status |
|-------|--------|
| `GET /categories/videos` | ✅ Active video upload/browse categories (`general` + active programs except podcast hub) |
| `GET /categories/podcasts` | ✅ Active podcast show categories (labels used on `PodcastShow.category`) |
| `GET /categories/movies` | ✅ Active movie genres (`slug`, `label`) — admin: `GET/PUT /admin/config/movie-genres` |

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
| `GET /analytics/creators/me/dashboard` | ✅ Impact dashboard incl. **`gifts`** block |
| `GET /analytics/creators/me/stats` | ✅ |
| `GET /analytics/creators/me/content` | ✅ |
| `GET /analytics/creators/stats` | ✅ Legacy alias |

### `GET /analytics/creators/me/dashboard` — key fields

```json
{
  "partnerTier": "standard",
  "programVerticals": ["sports"],
  "performance": { "views24h", "views7d", "views30d", "watchHours30d", "subscribers", "engagement30d", "retentionRate" },
  "advertising": { "adImpressionsOnYourContent30d", "ctr30d", "…" },
  "financial": {
    "earnings30dUsd": "123.45",
    "giftsEarnings30dUsd": "12.30",
    "giftsEarningsLifetimeUsd": "45.67",
    "availableBalanceUsd": "100.00",
    "pendingPayoutUsd": "0.00"
  },
  "gifts": {
    "creatorSharePercent": 90,
    "coinsReceived30d": 500,
    "coinsReceivedLifetime": 2000,
    "giftCount30d": 12,
    "giftCountLifetime": 48,
    "grossValue30dUsd": "5.00",
    "earnings30dUsd": "4.50",
    "recent": [
      {
        "id": "uuid",
        "giftName": "Heart",
        "fromUsername": "fan1",
        "coins": 50,
        "creatorEarningsUsd": "0.45",
        "createdAt": "2026-06-19T12:00:00.000Z"
      }
    ]
  },
  "topContent": [],
  "content": []
}
```

---

## Public config (`/config`)

**Auth:** None

| Route | Notes |
|-------|--------|
| `GET /config/public` | `{ platformCreatorId, membership, ads: { shortsInterstitialEveryNSwipes, shortsInterstitialEnabled, shortsSkipSeconds, moviePrerollSkipSeconds, impressionRevenueCpmUsd, placements } }` — consumed by `/shorts` and ad UI |
| `GET /config/viewer-geo` | `{ geo: { city, region, regionName, countryCode } \| null }` — server IP geolocation; used instead of third-party browser geo on localhost |

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
| `GET /admin/users`, `GET /admin/users/:id` | Search; detail includes `payoutProfile`, `socialLinks`, `premiumTier`, `verticalSeries[]`, `content[]` with `siteHref`, payout history with `method` + `payoutDetails` |
| `GET /admin/payouts` | `?status=` — each row includes `payoutDetails` snapshot |
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
| `GET /admin/videos/:id` | Full metadata for admin movie/video edit sheet |
| `PUT /admin/videos/:id` | Update metadata (title, description, cast, genre, age rating, etc.) |
| `PUT /admin/vertical-series/:slug` | Series title, description, status, etc. |
| `PUT /admin/vertical-episodes/:id` | Episode metadata |
| `PUT /admin/podcast-episodes/:id` | Episode metadata |
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
| `GET/PUT /admin/config/movie-genres` | Movie genres — add/edit/delete; drives `GET /categories/movies`, `/movies` filters, admin movie upload |

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
| `GET/POST /admin/ads/campaigns`, `GET /admin/ads/campaigns/:id`, `PUT …/status`, `PUT …/:id` | Campaign CRUD + full edit |
| `GET /admin/ads/campaigns/:id/analytics` | Sponsor/admin performance + click geography |
| `GET /admin/economy/gifts`, `GET /admin/economy/transactions` | Activity feeds |

### Still planned

| Item | Notes |
|------|--------|
| CSV export | Analytics export |
| Advertiser portal analytics | Self-serve campaign reports for `/advertisers` |

**Seeded `revenue_split_rules` keys:** `live_event`, `viewer_support`, `insider_membership`, `ad_gaf_allocation`, `sponsorship`, `creator_subscription`, `coin_purchase`, `store_merchandise`

---

## Revenue & economy (DB ready — partial APIs)

Tables: `revenue_split_rules`, `revenue_ledger_*`, `gaf_*`, `viewer_support_transactions`, `live_events`, `creator_stores`, `platform_insider_subscriptions`, etc. Gifts use `RevenueSplitService` + `viewer_support` rule.

---

## Shared response types

Canonical shapes returned across multiple endpoints. Field names are stable — use these to define TypeScript interfaces in the React Native app.

### `VideoCard`

Returned by feed endpoints, `GET /videos/:id` (extended), shorts, movies browse.

```json
{
  "id": "uuid",
  "title": "Video title",
  "thumbnailUrl": "https://…",
  "durationSeconds": 120,
  "viewsCount": 1000,
  "likesCount": 50,
  "commentsCount": 10,
  "type": "short",
  "category": "general",
  "vertical": "general",
  "releaseYear": null,
  "ageRating": null,
  "tagline": null,
  "channel": "Creator Name",
  "channelSlug": "creator_handle",
  "creatorId": "uuid",
  "playbackUrl": "https://…/master.m3u8",
  "videoUrl": "https://…/master.m3u8"
}
```

`type` enum: `short` \| `video` \| `movie`. When JWT sent, detail/feed items may also include `liked`, `saved`, `disliked`, `isFollowing`, `dislikesCount`.

### `User` (`GET /users/me`)

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "handle",
  "displayName": "Display Name",
  "avatarUrl": "https://…",
  "bannerUrl": "https://…",
  "bio": "…",
  "role": "user",
  "isVerified": false,
  "streamerStatus": "none",
  "verticalCreatorStatus": "none",
  "partnerTier": "standard",
  "programVerticals": [],
  "coinsBalance": 100,
  "premiumTier": "none",
  "premiumExpiresAt": null,
  "followersCount": 10,
  "followingCount": 5,
  "videosCount": 3,
  "socialLinks": [{ "label": "Twitter", "url": "https://…", "sortOrder": 0 }],
  "notificationPrefs": [{ "type": "like", "enabled": true }]
}
```

`streamerStatus` / `verticalCreatorStatus`: `none` \| `pending` \| `approved` \| `rejected`.

### Public profile (`GET /users/:username`)

Same core fields plus `isLive`, `liveStreamId`, `isFollowing`, `isChannelMember`, `liveAlertsOn` when requester is authenticated.

### Pagination `meta`

```json
{ "page": 1, "limit": 24, "total": 142 }
```

### Shorts cursor response

```json
{
  "items": [ "…VideoCard + liked/saved/disliked/isFollowing" ],
  "nextCursor": "20"
}
```

`nextCursor` is `null` when no more pages.

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
| `THROTTLE_TTL_MS` | No | `60000` | Rate-limit window (ms); **per client IP**, not global |
| `THROTTLE_LIMIT` | No | `1000` | Max HTTP requests per IP per window; see [security-checklist.md](./security-checklist.md#api-rate-limit-quota) |
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
| `AUTO_APPROVE_VERTICAL_CREATOR` | No | `false` | `true` / `1` in **non-production** only — skip admin queue for vertical creator applications |
| `STRIPE_SECRET_KEY` | No | — | Empty → dev-mode instant coin/premium/membership grants |
| `STRIPE_WEBHOOK_SECRET` | No | — | Required with Stripe; see [`stripe-production.md`](./stripe-production.md) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | No | — | Password-reset email |

**Live stack:** `docker compose up -d mediamtx` (custom image `prysymtv-mediamtx:local` includes `curl` for webhooks) exposes RTMP `:1935` and HLS `:8888`. MediaMTX calls `POST /streams/mediamtx/auth` and `POST /streams/webhooks/ready|done` on the API (no Bearer). Run the API on the host so the container can reach `host.docker.internal:4000`. See [how-to-run.md](./how-to-run.md) § Live streaming.

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

1. **Access token:** Store in secure storage on mobile (`expo-secure-store`, Keychain). Web dev uses `sessionStorage`.
2. **Refresh token:** HttpOnly cookie only — mobile must persist `prysym_refresh` cookie manually (see [React Native integration](#react-native-integration)). Not in JSON body.
3. **Token rotation:** Each `/auth/refresh` revokes the previous refresh session and issues a new cookie.
4. **HTTPS + secure cookies** required in production (`NODE_ENV=production`).
5. **Rate limiting** on all routes; stricter on auth (429 on exceed).
6. **Argon2id** password hashing.

---

## Reports (`/reports`) ✅

**Auth:** Bearer required. Same data model as `POST /videos/:id/report` (video-only shorthand).

| Route | Body |
|-------|------|
| `POST /reports` | `{ targetType: video \| stream \| user \| comment \| podcast_episode \| vertical_episode, targetId, reason, details? }` — `reason`: `spam` \| `nudity` \| `violence` \| `harassment` \| `other` |

### React Native env (recommended)

| Variable | Example | Notes |
|----------|---------|-------|
| `API_BASE_URL` | `https://srv1765056.hstgr.cloud/api/v1` | Same as web `NEXT_PUBLIC_API_URL` |
| `WS_URL` | `https://srv1765056.hstgr.cloud` | Socket.IO — no `/api/v1` |

---

*Last updated: 2026-06-19 — React Native integration guide, production base URL, complete endpoint index (podcast video/cover, dislikes, advertisers, admin deletes), health response fields, feed home algorithms (`newReleases` vs `movies`), shorts `isFollowing`, podcast `mediaType`/`videoUrl`, WebSocket `gift` event, creator dashboard `gifts` block, shared response types (`VideoCard`, `User`, pagination), notification deep-link metadata, mobile auth cookie guidance. Production Stripe: [`stripe-production.md`](./stripe-production.md).*

# Prysym TV — Missing Features & Gaps

This document tracks what is **not yet available** for building the React Native app (or production mobile launch), and what is **available in the backend but under-documented** in [`api.md`](./api.md).

**Related:** [`api.md`](./api.md) is the primary REST reference and includes a [React Native integration](./api.md#react-native-integration) section for everything the API supports today.

**Last updated:** 2026-06-19

---

## Summary

| Category | Count | Blocks mobile launch? |
|----------|-------|------------------------|
| Backend not implemented | 4 major items | Partially — auth workaround exists; push is the main gap for polish |
| Documentation gaps only | 3 items | No — can use API + web `lib/api/*` types |
| Client-only work | 2 items | No — normal mobile app engineering |

---

## 1. Backend does not implement (API gaps)

These features cannot be used from React Native until the API is extended. They are **not** omissions in `api.md` — the routes or behavior simply do not exist.

### 1.1 Push notifications (FCM / APNs)

**Status:** Not implemented

**What exists today:**
- In-app notifications only: `GET /users/me/notifications`
- Notification types: `follow`, `like`, `comment`, `gift`, `live`, `upload`, `system`
- `metadata` on each row for deep linking (see `api.md`)

**What is missing:**
- No endpoint to register a device push token (e.g. `POST /users/me/push-tokens`)
- No server-side integration with FCM (Android) or APNs (iOS)
- No push delivery when the app is backgrounded or closed

**Impact:** Users must open the app (or poll) to see new notifications. Live alerts, gifts, follows, etc. will not appear as OS push banners without new backend work.

**Suggested API (future):**

| Method | Path | Body |
|--------|------|------|
| `POST` | `/users/me/push-tokens` | `{ token, platform: "ios" \| "android", deviceId? }` |
| `DELETE` | `/users/me/push-tokens` | `{ token }` or `{ deviceId }` |

Plus: worker or hook on notification creation to fan out to registered tokens.

---

### 1.2 OAuth (Google / Apple sign-in)

**Status:** Planned — routes listed in `api.md` as 📋

| Method | Path | Status |
|--------|------|--------|
| `POST` | `/auth/oauth/google` | Not in codebase |
| `POST` | `/auth/oauth/apple` | Not in codebase |

**What exists today:**
- Email + password: `POST /auth/register`, `POST /auth/login`
- Password reset: `POST /auth/forgot-password`, `POST /auth/reset-password`

**Impact:** Mobile app must use email/password auth unless OAuth is added. Apple Sign In is often required for App Store if other social logins are offered.

---

### 1.3 Refresh token in JSON (native-friendly auth)

**Status:** Not implemented — cookie-only refresh

**Current behavior:**
- Login/register return: `{ accessToken, tokenType, expiresIn, user }` — **no `refreshToken` in body**
- Refresh token is set only as HttpOnly cookie `prysym_refresh` (path `/api/v1/auth`, default 7-day TTL)
- `POST /auth/refresh` and `POST /auth/logout` read the cookie only — no `{ refreshToken }` body support

**Workaround for React Native (documented in `api.md`):**
- Parse `Set-Cookie` after login and send `Cookie: prysym_refresh=…` on refresh/logout
- Store `accessToken` in secure storage (`expo-secure-store`, Keychain)

**Recommended API change:**
- Include `refreshToken` in login/register/refresh JSON responses
- Accept `{ refreshToken }` in body on `/auth/refresh` and `/auth/logout` (in addition to cookie for web backward compatibility)
- Rotate refresh token on each refresh (already happens server-side)

**Impact:** Mobile auth works with extra cookie handling; native JSON refresh would be simpler and more reliable.

---

### 1.4 Phase 2+ API namespaces

**Status:** Mostly planned or admin-only — not full consumer/mobile APIs

Listed in `api.md` under “Planned API namespaces”:

| Prefix | Purpose | Notes |
|--------|---------|-------|
| `/events` | Live events — tickets, schedule | Not implemented for consumers |
| `/stores` | Creator Store | Not implemented |
| `/support` | Tips, donations, super chats | Gifts exist via `/billing/gifts/send`; this namespace does not |
| `/insider` | Platform Insider subscription | DB tables exist; no dedicated consumer routes |
| `/sponsorships` | Brand ↔ creator deals | Not implemented |
| `/revenue` | Ledger queries | Admin-oriented; creators use dashboard + payout routes |

**Partially implemented (admin / B2B only):**
- `/advertisers` — `POST /advertisers/register`, `GET /advertisers/me`, `GET /advertisers/me/:id`
- GAF ledger — `GET /admin/gaf/ledger` (admin only)

**Impact:** Mobile app does not need these for V1 unless you scope events, store, or insider into launch.

---

### 1.5 OpenAPI / Swagger specification

**Status:** Not generated

**What exists:** Human-readable [`api.md`](./api.md) with route index and selected JSON examples.

**What is missing:**
- Machine-readable OpenAPI 3 spec
- Auto-generated TypeScript client for React Native (e.g. `openapi-typescript`, Orval)

**Impact:** Manual API integration only; no codegen from a single source of truth.

---

## 2. Documentation gaps only (backend has it)

These are **implemented and usable** from React Native. `api.md` documents routes and core types but not every response field. The web app’s `lib/api/*` modules are the best supplement.

### 2.1 Secondary response schemas

**Status:** API returns data; `api.md` has partial schemas

| Area | Documented in `api.md`? | Where to find shapes |
|------|-------------------------|----------------------|
| `VideoCard`, `User`, pagination | Yes | `api.md` — Shared response types |
| Comments (list + replies) | Route only | `lib/api/videos.ts`, hit `GET /videos/:id/comments` |
| Playlists + items | Route only | `lib/api/playlists.ts` |
| Search results (`videos`, `creators`, `podcasts`, `streams`) | Route only | `lib/api/search.ts`, `api/src/search/search.service.ts` |
| Stream detail (`GET /streams/:id`) | Route only | `lib/api/streams.ts` |
| Gift catalog items | Route only | `GET /billing/gifts/catalog` |
| Saved / liked list wrappers | Route only | `lib/api/users.ts` |
| Billing products / coin packages | Route only | `GET /billing/products` |
| Creator stats / content rows | Partial (dashboard documented) | `lib/api/analytics.ts` |

**Impact:** Does not block development — copy types from web or infer from API responses.

---

### 2.2 Local storage multipart upload details

**Status:** Implemented when `STORAGE_DRIVER=local` (dev)

Routes: `POST /media/upload/:videoId`, `/media/profile-upload`, `/media/podcast-upload`, `/media/podcast-cover-upload`, `/media/ad-upload`

**Gap:** `api.md` notes these routes exist but does not document exact multipart field names and form structure.

**Production:** S3/R2 uses presigned `PUT` from init endpoints — fully documented in `api.md` (`UploadTarget` shape).

**Impact:** Dev-only inconvenience; production mobile uses presigned PUT.

---

### 2.3 HTTP error catalog

**Status:** Generic error format documented; not every status code per route

`api.md` shows:

```json
{
  "statusCode": 400,
  "message": ["validation error"],
  "error": "Bad Request"
}
```

**Also used:** `401` (unauthorized), `403` (forbidden), `404` (not found), `429` (rate limit — auth routes stricter).

**Impact:** Standard NestJS behavior; mobile clients should handle 401 with refresh retry (documented in RN section).

---

## 3. Client-only work (not backend or doc gaps)

These are normal React Native engineering tasks, not missing API features.

### 3.1 Go Live from phone camera

**API support:** Yes — `POST /streams/init` returns RTMP URL + stream key; `GET /streams/ingest/health` for diagnostics; HLS playback via `GET /streams/:id`.

**Client gap:** Broadcasting from the device camera requires an RTMP publisher SDK (e.g. native module, Larix, or similar). The REST API does not encode video from the phone — that is the mobile app’s responsibility.

---

### 3.2 Offline, caching, and image optimization

**API support:** N/A — CDN URLs on `thumbnailUrl`, `hlsMasterUrl`, `avatarUrl`, etc.

**Client gap:** Cache policy, offline downloads, prefetch — implement in React Native (e.g. `react-native-fast-image`, custom cache). Not an API feature.

---

## 4. What `api.md` already covers (for reference)

Use this checklist when scoping the RN app — **no backend gap** for these:

- [x] Home feed, trending, movies, shorts, new releases algorithms
- [x] Video/movie/short playback (HLS)
- [x] Podcasts (audio + video episodes)
- [x] Verticals (micro-dramas)
- [x] Live streams + Socket.IO chat + live gift events
- [x] Likes, dislikes, saves, comments, follow, live alerts
- [x] Gifts / tips (coins) on streams, videos, profiles
- [x] Playlists, search, watch history, continue watching
- [x] Ads (serve, impression, click) + premium ad-free
- [x] Stripe checkout (coins, premium, channel membership)
- [x] Creator dashboard, payouts, uploads
- [x] In-app notifications + deep-link metadata
- [x] Reports / moderation (user-facing report)
- [x] Public config (`GET /config/public`)
- [x] React Native integration guide (auth, uploads, WebSocket, screen map)

---

## 5. Recommended priorities for mobile launch

| Priority | Item | Type | Effort |
|----------|------|------|--------|
| **P0** | `refreshToken` in login/refresh JSON | Backend + `api.md` | Small |
| **P1** | Push token registration + FCM/APNs delivery | Backend + `api.md` | Medium |
| **P2** | Apple Sign In (+ optional Google OAuth) | Backend + `api.md` | Medium |
| **P3** | OpenAPI spec generation | Tooling + docs | Medium |
| **P4** | Full JSON schemas in `api.md` or exported types package | Docs only | Small–medium |
| **Defer** | Phase 2 namespaces (events, store, insider) | Backend | Large |

---

## 6. Quick reference: “Is it missing from the backend?”

| Feature | Backend? | In `api.md`? |
|---------|----------|--------------|
| Push notifications | No | Mentioned as gap in RN section |
| OAuth Google/Apple | No | Marked 📋 planned |
| Refresh token in JSON | No | Documented workaround |
| In-app notifications | Yes | Yes |
| Email/password auth | Yes | Yes |
| All V1 content & engagement | Yes | Yes |
| Gift on video/shorts (not just live) | Yes | Yes |
| Video podcasts | Yes | Yes |
| Comment/playlist full schemas | Yes (API) | Partial (doc) |
| OpenAPI spec | No | No |

---

*For implementation details on what **is** available, see [`api.md`](./api.md).*

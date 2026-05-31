# Prysym TV — REST API Reference

**Base URL:** `http://localhost:4000/api/v1` (development)  
**Auth:** Bearer access token in `Authorization` header. Refresh token in HttpOnly cookie `prysym_refresh` (web).  
**Content-Type:** `application/json` unless noted.

**Status legend**

| Status | Meaning |
|--------|---------|
| ✅ Implemented | Production-ready for local dev |
| 🚧 Stub | Route exists; business logic pending (see week in backend plan) |

---

## Health

### `GET /health` ✅

**Purpose:** Liveness + database connectivity.

**Auth:** None

**Response `200`**
```json
{
  "status": "ok",
  "timestamp": "2026-05-31T12:00:00.000Z"
}
```

---

## Auth (`/auth`)

### `POST /auth/register` ✅

**Purpose:** Create account and issue tokens.

**Body**
```json
{
  "email": "user@example.com",
  "username": "creator_jane",
  "password": "securePass123",
  "displayName": "Jane Creator"
}
```

**Response `201`**
```json
{
  "accessToken": "eyJhbG...",
  "tokenType": "Bearer",
  "expiresIn": "15m",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "creator_jane",
    "role": "user"
  }
}
```

**Sets cookie:** `prysym_refresh` (HttpOnly)

**Errors:** `409` duplicate email/username, `400` validation

---

### `POST /auth/login` ✅

**Purpose:** Authenticate with email + password.

**Body**
```json
{
  "email": "user@example.com",
  "password": "securePass123"
}
```

**Response:** Same shape as register.

**Errors:** `401` invalid credentials

---

### `POST /auth/refresh` ✅

**Purpose:** Rotate access token using refresh cookie.

**Auth:** Cookie `prysym_refresh`

**Response:** Same as login (new access token + new refresh cookie).

---

### `POST /auth/logout` ✅

**Purpose:** Revoke refresh session and clear cookie.

**Auth:** Optional refresh cookie

**Response**
```json
{ "success": true }
```

---

### `POST /auth/forgot-password` ✅

**Purpose:** Start password reset (email link in production).

**Body**
```json
{ "email": "user@example.com" }
```

**Response `200`**
```json
{
  "success": true,
  "message": "If the email exists, a reset link was sent.",
  "devResetToken": "only-in-development"
}
```

---

### `POST /auth/reset-password` ✅

**Purpose:** Complete reset with token from email.

**Body**
```json
{
  "token": "raw-token-from-email",
  "newPassword": "newSecurePass123"
}
```

**Response**
```json
{ "success": true }
```

---

### `POST /auth/oauth/google` 🚧 Week 1

**Body:** `{ "idToken": "..." }`

### `POST /auth/oauth/apple` 🚧 Week 1

**Body:** `{ "identityToken": "...", "authorizationCode": "..." }`

---

## Users (`/users`)

### `GET /users/me` ✅

**Purpose:** Current user profile + counts.

**Auth:** Bearer required

**Response `200`**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "creator_jane",
  "displayName": "Jane",
  "avatarUrl": null,
  "bannerUrl": null,
  "bio": null,
  "role": "user",
  "isVerified": false,
  "streamerStatus": "none",
  "coinsBalance": 0,
  "premiumTier": "none",
  "premiumExpiresAt": null,
  "followersCount": 0,
  "followingCount": 0,
  "videosCount": 0,
  "socialLinks": [],
  "notificationPrefs": []
}
```

---

### `PUT /users/me` ✅

**Body** (all optional)
```json
{
  "displayName": "Jane",
  "bio": "Creator bio",
  "avatarUrl": "https://cdn.../avatar.jpg",
  "bannerUrl": "https://cdn.../banner.jpg"
}
```

**Response:** Updated user object (same as GET /me).

---

### `GET /users/me/notification-preferences` ✅

**Response**
```json
[
  { "userId": "uuid", "type": "follow", "enabled": true },
  { "type": "like", "enabled": true }
]
```

---

### `PUT /users/me/notification-preferences` ✅

**Body**
```json
{ "type": "live", "enabled": false }
```

`type` enum: `follow` | `like` | `comment` | `gift` | `live` | `upload` | `system`

---

### `PUT /users/me/social-links` ✅

**Body**
```json
{
  "links": [
    { "label": "Website", "url": "https://example.com", "sortOrder": 0 }
  ]
}
```

---

### `POST /users/apply-streamer` ✅

**Body**
```json
{
  "description": "I stream games daily...",
  "idDocumentUrl": "optional-r2-path"
}
```

**Response**
```json
{ "success": true, "streamerStatus": "pending" }
```

---

### `GET /users/me/videos` ✅

**Query:** `page`, `limit`

**Response**
```json
{
  "items": [],
  "meta": { "page": 1, "limit": 20, "total": 0 }
}
```

---

### `GET /users/me/saved` ✅

**Query:** `page`, `limit` — watchlist from `saved_items`.

---

### `GET /users/me/liked` ✅

**Query:** `page`, `limit` — polymorphic likes.

---

### `GET /users/me/notifications` ✅

**Query:** `page`, `limit`

---

### `PUT /users/me/notifications/:id/read` ✅

**Response:** `{ "success": true }`

---

### `PUT /users/me/notifications/read-all` ✅

---

### `DELETE /users/me/notifications` ✅

---

### `GET /users/:username` ✅

**Purpose:** Public creator profile.

**Response**
```json
{
  "username": "creator_jane",
  "displayName": "Jane",
  "followersCount": 0,
  "isLive": false,
  "liveStreamId": null
}
```

---

### `POST /users/:username/follow` ✅

**Auth:** Bearer required

---

### `DELETE /users/:username/follow` ✅

---

## Feed (`/feed`)

### `GET /feed/home` 🚧 Week 7

**Purpose:** Aggregated home payload.

### `GET /feed/trending` 🚧

---

## Videos (`/videos`)

### `POST /videos/upload/init` 🚧 Week 2

### `POST /videos/upload/complete` 🚧 Week 2

### `GET /videos/feed/shorts` 🚧 Week 3

**Query:** `cursor`

### `GET /videos/feed/movies` 🚧 Week 3

### `GET /videos/feed/movies/featured` 🚧 Week 3

### `GET /videos/:id` 🚧 Week 3

### `POST /videos/:id/like` 🚧 Week 3

### `POST /videos/:id/save` 🚧 Week 3

### `POST /videos/:id/report` 🚧 Week 3

---

## History (`/history`) ✅

All routes require Bearer auth.

### `GET /history`

**Query:** `page`, `limit`

### `POST /history/progress` ✅

**Body**
```json
{
  "contentType": "video",
  "contentId": "uuid",
  "progressSeconds": 120,
  "completed": false
}
```

### `DELETE /history/clear` ✅

### `DELETE /history/:contentType/:contentId` ✅

`contentType`: `video` | `podcast_episode`

---

## Billing (`/billing`)

### `GET /billing/products` ✅

**Purpose:** Coin packages (matches frontend CoinsModal).

**Response**
```json
[
  { "id": "starter", "coins": 100, "priceUsd": "0.99", "label": "Starter" }
]
```

---

### `GET /billing/gifts/catalog` ✅

**Purpose:** Gift definitions for live streams.

---

### `POST /billing/stripe/create-checkout` 🚧 Week 5

### `POST /billing/gifts/send` 🚧 Week 5

---

## Streams (`/streams`)

### `POST /streams/init` 🚧 Week 4

### `GET /streams/live` 🚧 Week 4

### `GET /streams/:id` 🚧 Week 4

---

## Podcasts (`/podcasts`)

### `GET /podcasts/shows` 🚧 Week 7

### `GET /podcasts/episodes/feed` 🚧 Week 7

### `GET /podcasts/episodes/:id` 🚧 Week 7

---

## Playlists (`/playlists`)

### `GET /playlists/:id` 🚧 Week 3

---

## Search (`/search`)

### `GET /search` 🚧 Week 6

**Query:** `q`, `type`, `page`

### `GET /search/suggest` 🚧 Week 6

---

## Ads (`/ads`)

### `GET /ads/serve` 🚧 Week 8

**Query:** `placement` = `home_banner` | `shorts_interstitial` | `movie_preroll`

### `POST /ads/track/impression` 🚧 Week 8

### `POST /ads/track/click` 🚧 Week 8

---

## Analytics (`/analytics`)

### `POST /analytics/track` 🚧 Week 6

**Body:** Batch events (views, shares, watch time).

### `GET /analytics/creators/stats` 🚧 Week 9

**Auth:** Bearer + role `creator` or `admin`

---

## Admin (`/admin`)

### `GET /admin/analytics/overview` 🚧 Week 9

**Auth:** Bearer + role `admin`

---

## Error format

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

---

## Security notes (mobile + web)

1. Store **access token** in secure storage (Keychain / EncryptedSharedPreferences); never log it.
2. On web, rely on **HttpOnly refresh cookie** + `credentials: 'include'` for `/auth/refresh`.
3. On mobile, refresh token may be returned in body when implemented — use secure storage only.
4. All mutating routes use **rate limiting** (global + stricter on auth).
5. Passwords hashed with **Argon2id**; reset tokens stored hashed (SHA-256).
6. Use **HTTPS** in production; set `secure` cookies.

---

*Last updated: backend bootstrap — Week 1 auth, users, history, billing catalog.*

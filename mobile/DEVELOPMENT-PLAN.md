# PrysymTV Mobile App — Development Plan

**Purpose:** Step-by-step blueprint to build the PrysymTV React Native (Expo) app with **feature parity** to the website, using the existing REST API + Socket.IO backend.

**Audience:** Engineers implementing `mobile/` from the current Expo scaffold (`App.tsx` placeholder only).

**Canonical API reference:** [`../guides-md-files/api.md`](../guides-md-files/api.md)  
**Web reference implementation:** [`../app/`](../app/), [`../components/`](../components/), [`../lib/api/`](../lib/api/)

**Production API:** `https://srv1765056.hstgr.cloud/api/v1`  
**WebSocket host:** `https://srv1765056.hstgr.cloud` (namespace `/streams`)

> **API endpoints:** [`../guides-md-files/api.md`](../guides-md-files/api.md) is the **authoritative list** of every REST route, request/response shapes, auth rules, and React Native integration notes. When you need to know *what* to call, start there — this plan describes *how* to wire the mobile app around those endpoints.
>
> **When you're stuck on behavior or UX:** Use the **website frontend** as the reference implementation. Run the Next.js app locally (`pnpm dev` from the repo root) and trace the matching screen under [`../app/`](../app/), UI in [`../components/`](../components/), and API calls in [`../lib/api/`](../lib/api/). If a feature works on web, mirror its flow, state, and endpoint usage on mobile.

---

## Table of contents

1. [Goals & scope](#1-goals--scope)
2. [Current state](#2-current-state)
3. [Tech stack (locked decisions)](#3-tech-stack-locked-decisions)
4. [Repository layout](#4-repository-layout)
5. [Design system (match the website)](#5-design-system-match-the-website)
6. [Navigation architecture](#6-navigation-architecture)
7. [Environment & configuration](#7-environment--configuration)
8. [Core infrastructure (build first)](#8-core-infrastructure-build-first)
9. [Authentication & session](#9-authentication--session)
10. [API client layer](#10-api-client-layer)
11. [Shared types & utilities](#11-shared-types--utilities)
12. [Feature modules (screen-by-screen)](#12-feature-modules-screen-by-screen)
13. [Native & mobile-only enhancements](#13-native--mobile-only-enhancements)
14. [Ads, billing & monetization](#14-ads-billing--monetization)
15. [Creator tools & uploads](#15-creator-tools--uploads)
16. [Admin panel (role-gated)](#16-admin-panel-role-gated)
17. [Deep linking & universal links](#17-deep-linking--universal-links)
18. [Offline, caching & performance](#18-offline-caching--performance)
19. [Testing strategy](#19-testing-strategy)
20. [Phased delivery schedule](#20-phased-delivery-schedule)
21. [Definition of done](#21-definition-of-done)
22. [Appendix A — Screen → route → API map](#appendix-a--screen--route--api-map)
23. [Appendix B — Dependency install list](#appendix-b--dependency-install-list)
24. [Appendix C — Web file porting index](#appendix-c--web-file-porting-index)

---

## 1. Goals & scope

### 1.1 Product goals

| Goal | Detail |
|------|--------|
| **Parity** | Every viewer-facing and creator-facing feature on the website must exist in the mobile app |
| **Design** | Dark-first UI matching web tokens (orange `#EF511D` primary, Geist-like typography, rounded cards) |
| **API** | Zero custom mobile-only backend for v1 — consume existing `/api/v1` endpoints |
| **Native value** | Push notifications, background audio, PiP video, haptics, share sheet, secure auth storage |
| **Admin** | Full admin console for `role === "admin"` users (tablet-friendly layouts acceptable) |

### 1.2 Out of scope for v1 (document only)

| Item | Reason |
|------|--------|
| `POST /auth/oauth/google`, `/auth/oauth/apple` | API marked 📋 planned — add when backend ships |
| Public store checkout | Web store is catalog-only today — mirror that |
| Offline downloads / DRM | Not in API |
| Custom mobile analytics SDK | Use `POST /analytics/track` batches |

### 1.3 SDK note

Dev uses **Expo SDK 54** (Expo Go compatible). Before Play/App Store release, upgrade SDK per [`NOTE.md`](./NOTE.md) and ship **development builds** (not Expo Go).

---

## 2. Current state

```
mobile/
├── App.tsx              # Placeholder "PrysymTV" text only
├── index.ts             # Expo entry
├── app.json
├── package.json         # expo@54, react-native@0.81 — no navigation/API libs yet
├── README.md
├── NOTE.md
└── DEVELOPMENT-PLAN.md  # This file
```

**Nothing is wired:** no navigation, auth, API client, or screens.

---

## 3. Tech stack (locked decisions)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Expo SDK 54+** (upgrade before store) | Matches repo; EAS Build for production |
| Language | **TypeScript strict** | Same as web monorepo |
| Navigation | **Expo Router v4** (file-based) | Deep links, stacks + tabs, matches Next mental model |
| Server state | **TanStack Query v5** | Caching, pagination, retry, pull-to-refresh |
| Client state | **Zustand** (minimal) | Auth snapshot, player UI, ad session counters |
| HTTP | **`fetch`** wrapper | Mirror [`lib/api-client.ts`](../lib/api-client.ts) |
| Secure storage | **expo-secure-store** | Access token |
| Refresh cookie | **@react-native-cookies/cookies** | Required until API returns `refreshToken` in JSON |
| Video | **react-native-video** | HLS `m3u8` for all long-form, shorts, movies, verticals, live |
| Live chat | **socket.io-client** | Namespace `/streams` |
| Images | **expo-image** | Thumbnails, avatars, caching |
| Forms | **react-hook-form + zod** | Login, register, uploads metadata |
| UI primitives | **Custom components** styled with tokens | Do not copy shadcn DOM — replicate visually |
| Icons | **lucide-react-native** | Same icon set as web |
| Lists | **@shopify/flash-list** | Shorts feed, comments, admin tables |
| Gestures | **react-native-gesture-handler + reanimated** | Shorts vertical swipe, pull-to-refresh |
| Push | **expo-notifications** + **expo-device** | FCM/APNs via EAS |
| Payments | **expo-web-browser** | Stripe checkout URLs |
| Haptics | **expo-haptics** | Like, gift send, follow |
| Share | **expo-sharing** + **react-native Share API** | Content + profile share |
| Background audio | **expo-av** or react-native-video audio mode | Podcasts |
| Picture-in-Picture | **expo-video** PiP (SDK-dependent) or native module | Long-form + live |

---

## 4. Repository layout

Create this structure under `mobile/`:

```
mobile/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root providers (Query, Auth, Theme)
│   ├── index.tsx                 # Redirect → (tabs)/home
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx    # ?token= deep link
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab navigator (5 tabs + center Home)
│   │   ├── home.tsx
│   │   ├── videos.tsx
│   │   ├── shorts.tsx
│   │   ├── explore.tsx           # Movies + Verticals hub OR split — see §6
│   │   ├── podcasts.tsx
│   │   └── profile.tsx
│   ├── search.tsx                # Modal stack screen
│   ├── watch/[id].tsx
│   ├── movie/[id].tsx
│   ├── shorts/[id].tsx           # Optional deep link entry
│   ├── live/[id].tsx
│   ├── podcast/[id].tsx
│   ├── verticals/
│   │   ├── index.tsx
│   │   ├── [slug].tsx
│   │   └── watch/[slug]/[episode].tsx
│   ├── creator/[username].tsx
│   ├── playlist/[id].tsx
│   ├── premium.tsx
│   ├── advertise.tsx
│   ├── history.tsx
│   ├── help.tsx
│   ├── guidelines.tsx
│   ├── terms.tsx
│   ├── privacy.tsx
│   ├── cookies.tsx
│   ├── go-live.tsx
│   ├── upload.tsx
│   ├── creator-dashboard.tsx
│   ├── settings/
│   │   ├── index.tsx
│   │   ├── notifications.tsx
│   │   ├── social.tsx
│   │   └── edit-profile.tsx
│   └── (admin)/                  # Guard: user.role === 'admin'
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── users/
│       ├── applications/
│       ├── content/
│       ├── ads/
│       ├── moderation/
│       ├── payouts/
│       ├── analytics/
│       ├── config/
│       └── ...                   # Mirror web /admin routes
├── src/
│   ├── api/                      # Port from ../lib/api/*
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── feed.ts
│   │   ├── videos.ts
│   │   ├── ...                   # One file per web lib/api module
│   │   └── types.ts
│   ├── auth/
│   │   ├── AuthProvider.tsx
│   │   ├── session.ts            # token + cookie persistence
│   │   └── useAuth.ts
│   ├── components/
│   │   ├── ui/                   # Button, Input, Card, Sheet, Avatar...
│   │   ├── video/                # Players, controls, progress
│   │   ├── feed/                 # Rows, cards, skeletons
│   │   ├── ads/                  # Banner, interstitial, preroll
│   │   └── ...
│   ├── hooks/
│   ├── theme/
│   │   ├── colors.ts             # From globals.css tokens
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── navigation/
│   │   └── linking.ts            # Universal link config
│   ├── notifications/
│   │   ├── push.ts
│   │   └── route-from-notification.ts
│   ├── player/
│   │   ├── progress.ts           # POST /history/progress debounce
│   │   └── analytics.ts          # POST /videos/:id/view, vertical view
│   └── utils/
│       ├── format-media.ts       # Port from ../lib/format-media
│       └── validation/email.ts
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── fonts/                    # Geist if licensed, else Inter
├── app.config.ts                 # Expo config (env, scheme, plugins)
└── eas.json                      # EAS Build profiles
```

**Rule:** Business logic lives in `src/api` + hooks; `app/` screens are thin composition layers.

---

## 5. Design system (match the website)

### 5.1 Color tokens

Port from [`app/globals.css`](../app/globals.css) into `src/theme/colors.ts`:

| Token | Hex / value | Usage |
|-------|-------------|-------|
| `background` | `oklch(0.1 0 0)` ≈ `#1a1a1a` | Screen backgrounds |
| `foreground` | near white | Primary text |
| `primary` | `#EF511D` | CTAs, active tab, live badge |
| `secondary` | dark gray | Input backgrounds |
| `mutedForeground` | gray | Subtitles, metadata |
| `border` | `oklch(0.25 0 0)` | Cards, dividers |
| `destructive` | red | Errors |
| `card` | `oklch(0.15 0 0)` | Elevated surfaces |

Default theme: **dark only** for v1 (match web default). Optional light mode later.

### 5.2 Typography

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| `hero` | 32–40 | 900 | Home hero |
| `h1` | 24 | 700 | Screen titles |
| `h2` | 20 | 600 | Section headers |
| `body` | 14–16 | 400 | Paragraphs |
| `caption` | 10–12 | 500 | Tab labels, badges |

### 5.3 Component parity checklist

Replicate these web components as RN equivalents:

| Web component | Mobile component | Notes |
|---------------|------------------|-------|
| `bottom-navigation.tsx` | `TabBar` in `(tabs)/_layout` | 5 tabs: Videos, Movies, Shorts, Verticals, Podcasts — **add Home as stack entry or 6th tab** |
| `header.tsx` | `AppHeader` | Logo, search, notifications bell, avatar |
| `content-row.tsx` | `HorizontalContentRow` | FlashList horizontal |
| `movie-row.tsx` | `MovieRow` | Poster aspect 2:3 |
| `shorts-home-row.tsx` | `ShortsPreviewRow` | Opens full Shorts tab |
| `search-modal.tsx` | `search.tsx` screen | Suggest + results |
| `auth-modal.tsx` | `(auth)/*` screens | Full-screen sheets on mobile |
| `ad-banner.tsx` | `HomeAdBanner` | `home_banner` placement |
| `creator-dashboard-panel.tsx` | `CreatorDashboardScreen` | |
| `advertiser-register-modal.tsx` | `AdvertiseRegisterSheet` | |

### 5.4 Layout rules

- **Safe areas:** `react-native-safe-area-context` on all screens
- **Bottom inset:** Tab bar height + safe area; players use edge-to-edge
- **Border radius:** 12px (`--radius: 0.75rem`) on cards and inputs
- **Touch targets:** Minimum 44×44 pt
- **Shorts:** Full-bleed vertical video, overlay controls (like TikTok/Reels)

---

## 6. Navigation architecture

### 6.1 Tab bar (match web mobile bottom nav)

Web [`SIDEBAR_TABS`](../components/bottom-navigation.tsx):

| Tab ID | Label | Stack root |
|--------|-------|------------|
| `videos` | Videos | `/(tabs)/videos` |
| `movies` | Movies | `/(tabs)/movies` or nested in explore |
| `shorts` | Shorts | `/(tabs)/shorts` |
| `verticals` | Verticals | `/(tabs)/verticals` |
| `podcasts` | Podcasts | `/(tabs)/podcasts` |

**Recommendation:** Use **6 tabs** — insert **Home** (house icon) as first tab pointing to `/(tabs)/home`, because web desktop uses `/` as hub with live, continue watching, rows.

```
[ Home | Videos | Shorts | Movies | Verticals | Podcasts ]
```

Profile is **not** a tab on web mobile bottom nav — access via header avatar → `/(tabs)/profile` or `app/profile.tsx` as stack screen from header.

### 6.2 Stack navigators

| Stack | Screens |
|-------|---------|
| **Root** | Tabs, modals (search, auth), player screens |
| **Player** | `watch/[id]`, `movie/[id]`, `live/[id]`, `podcast/[id]`, `verticals/watch/...` |
| **Creator** | `creator/[username]`, `upload`, `go-live`, `creator-dashboard` |
| **Settings** | `settings/*`, `history`, `premium`, `advertise` |
| **Admin** | `(admin)/*` — only registered when `user.role === 'admin'` |

### 6.3 Auth gating

| Access | Behavior |
|--------|----------|
| Public browse | Home, feeds, search, public creator profiles |
| Soft gate | Like, save, comment, follow → prompt login sheet |
| Hard gate | Profile library, upload, go-live, dashboard, billing |
| Admin | Redirect non-admins away from `(admin)` |

---

## 7. Environment & configuration

### 7.1 `app.config.ts`

```typescript
extra: {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  wsUrl: process.env.EXPO_PUBLIC_WS_URL,
  webUrl: process.env.EXPO_PUBLIC_WEB_URL, // for legal links, Stripe return
}
```

### 7.2 `.env` files

| File | `EXPO_PUBLIC_API_BASE_URL` | `EXPO_PUBLIC_WS_URL` |
|------|---------------------------|----------------------|
| `.env.development` | `http://<LAN-IP>:4000/api/v1` | `http://<LAN-IP>:4000` |
| `.env.production` | `https://srv1765056.hstgr.cloud/api/v1` | `https://srv1765056.hstgr.cloud` |

### 7.3 `app.config.ts` plugins (required)

- `expo-router`
- `expo-secure-store`
- `expo-notifications`
- `expo-web-browser`
- `react-native-video` (config plugin)
- `@react-native-cookies/cookies` (if config plugin needed)

---

## 8. Core infrastructure (build first)

**Order matters — complete each step before feature screens.**

### Step 8.1 — Bootstrap Expo Router

```bash
cd mobile
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants
```

- Replace `App.tsx` with Expo Router entry (`package.json` `"main": "expo-router/entry"`).
- Create `app/_layout.tsx` with `Slot` and providers.

### Step 8.2 — Theme provider

- `src/theme/ThemeProvider.tsx` exports `colors`, `spacing`, `textStyles`.
- Wrap app in provider; all components use `useTheme()`.

### Step 8.3 — API client (`src/api/client.ts`)

Port behavior from [`lib/api-client.ts`](../lib/api-client.ts):

```typescript
// Required behavior:
// 1. prefix all paths with API_BASE_URL
// 2. attach Authorization: Bearer <accessToken> when set
// 3. JSON parse; throw ApiError with status + message array join
// 4. on 401: singleton refresh via POST /auth/refresh + Cookie header
// 5. retry original request once after refresh
// 6. on refresh fail: clear session, emit logout event
```

### Step 8.4 — TanStack Query

```typescript
// src/api/queryClient.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});
```

### Step 8.5 — Auth provider

See [§9](#9-authentication--session).

### Step 8.6 — Health check splash

On app launch: `GET /health` — if fail, show offline banner with retry (do not block browse if cached).

---

## 9. Authentication & session

### 9.1 Flow diagram

```
Register/Login → store accessToken (SecureStore)
              → parse Set-Cookie → store prysym_refresh (CookieManager)
              → fetch GET /users/me → hydrate user
              → register push token (if permission granted)

Every 14 min (or on 401) → POST /auth/refresh with Cookie
                         → update accessToken + rotated cookie

Logout → POST /auth/logout with Cookie → clear all local storage
```

### 9.2 Cookie handling (critical)

API does **not** return `refreshToken` in JSON. Mobile **must**:

1. After `POST /auth/login` or `/auth/register`, read `Set-Cookie` for `prysym_refresh`.
2. Store via `CookieManager.set(API_BASE_URL/auth, cookie)`.
3. On refresh/logout, send `Cookie: prysym_refresh=...` header.

Reference: [api.md — Cookie handling in React Native](../guides-md-files/api.md#cookie-handling-in-react-native)

### 9.3 Auth screens

| Screen | Endpoints | UI |
|--------|-----------|-----|
| Login | `POST /auth/login` | email, password, forgot link |
| Register | `POST /auth/register` | email, username, password, displayName |
| Forgot | `POST /auth/forgot-password` | email only; always show success |
| Reset | `POST /auth/reset-password` | token from deep link, new password |

Validation: mirror web + API DTOs (`@IsEmail`, min password 8).

### 9.4 `AuthProvider` API

```typescript
type AuthContext = {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(email, password): Promise<void>;
  register(body): Promise<void>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
};
```

### 9.5 Post-login redirect

Support `returnTo` path (mirror [`lib/safe-return-path.ts`](../lib/safe-return-path.ts)):

- Only allow paths starting with `/` (no `//` open redirect).
- Example: after login from Shorts like action → return to same Short.

---

## 10. API client layer

### 10.1 Port strategy

Copy each file from [`../lib/api/`](../lib/api/) into `mobile/src/api/`:

| Web file | Mobile file | Modify |
|----------|-------------|--------|
| `api-client.ts` | `client.ts` | Cookie refresh, SecureStore |
| `auth.ts` | `auth.ts` | Parse Set-Cookie on login |
| `types.ts` | `types.ts` | Direct copy |
| `feed.ts` | `feed.ts` | Direct copy |
| `videos.ts`, `videos-feed.ts` | same | Direct copy |
| `podcasts.ts` | `podcasts.ts` | Direct copy |
| `verticals.ts` | `verticals.ts` | Direct copy |
| `streams.ts`, `stream-chat.ts` | same | Socket separate |
| `history.ts` | `history.ts` | Direct copy |
| `playlists.ts` | `playlists.ts` | Direct copy |
| `search.ts` | `search.ts` | Direct copy |
| `comments.ts` | `comments.ts` | Direct copy |
| `billing.ts`, `billing-monetization.ts` | same | Stripe via WebBrowser |
| `ads.ts` | `ads.ts` | Direct copy |
| `notifications.ts` | `notifications.ts` | Direct copy |
| `users.ts` | `users.ts` | Direct copy |
| `stores.ts` | `stores.ts` | Direct copy |
| `advertisers.ts` | `advertisers.ts` | Direct copy |
| `analytics.ts` | `analytics.ts` | Direct copy |
| `reports.ts` | `reports.ts` | Direct copy |
| `config.ts` | `config.ts` | Direct copy |
| `admin.ts` | `admin.ts` | Admin screens only |

**Do not import from `../lib/api` at runtime** — duplicate into mobile package for independent bundling (or later extract shared `@prysym/api` package).

### 10.2 Pagination helpers

```typescript
// Page/limit: feed home, videos, history, notifications
type PageResponse<T> = { items: T[]; meta: { page, limit, total } };

// Cursor: shorts
type CursorResponse<T> = { items: T[]; nextCursor: string | null };
```

### 10.3 Upload helper

```typescript
async function uploadToTarget(target: UploadTarget, fileUri: string, onProgress?) {
  // PUT to target.uploadUrl with target.uploadHeaders
  // Use react-native-blob-util for progress events on large video
}
```

---

## 11. Shared types & utilities

Copy and use these types from api.md § Shared response types:

- `VideoCard`
- `MeResponse` / public `User`
- `NotificationMetadata`
- `ContinueWatchingFeedItem`
- `SavedItemRecord`, `LikedItemRecord`
- `PaginatedMeta`

Port utilities:

- [`lib/format-media.ts`](../lib/format-media.ts) — `formatDuration`, `formatViewCount`, `videoThumbnail`
- [`lib/validation/email.ts`](../lib/validation/email.ts)
- [`lib/share-links.ts`](../lib/share-links.ts) — native share message templates

---

## 12. Feature modules (screen-by-screen)

Each module lists: **Screen(s)**, **Web reference**, **API endpoints**, **Components to build**, **Acceptance criteria**.

---

### 12.1 Home (`/(tabs)/home`)

**Web ref:** [`app/page.tsx`](../app/page.tsx)

| Data | Endpoint |
|------|----------|
| Feed bundle | `GET /feed/home` |
| Continue watching | `GET /history` (auth) + local vertical progress |
| Ads | `GET /ads/serve?placement=home_banner` |
| Public config | `GET /config/public` |

**UI sections (in order):**

1. `AppHeader` — search, notifications, avatar
2. `FeaturedLive` — hero card → `live/[id]`
3. `ContinueWatchingRow` — horizontal scroll
4. `CategoryTabs` — all / movies / live / videos / series / trending (filter client-side or refetch)
5. `AdBanner` — sponsored strip
6. `LiveRow` — `feed.home.live`
7. `ShortsHomeRow` — top shorts → Shorts tab
8. `MovieRow` — top movies + new releases
9. `ContentRow` — trending videos
10. `PodcastHomeRow` — latest episodes
11. `VerticalsHomeRow` — series posters

**Acceptance:** Cold load < 3s on LTE; pull-to-refresh refetches; tapping any card opens correct player route.

---

### 12.2 Videos (`/(tabs)/videos`)

**Web ref:** [`app/videos/page.tsx`](../app/videos/page.tsx)

| Endpoint | Params |
|----------|--------|
| `GET /videos/feed/videos` | `vertical`, `sort`, `mode`, `page`, `limit`, `q` |
| `GET /categories/videos` | Category chips |
| `GET /programs` | Pillar filters |

**UI:** Filter chips + infinite scroll grid (`FlashList` numColumns=2).

**Player route:** `watch/[id]`

---

### 12.3 Shorts (`/(tabs)/shorts`)

**Web ref:** [`app/shorts/page.tsx`](../app/shorts/page.tsx)

| Endpoint | Notes |
|----------|-------|
| `GET /videos/feed/shorts` | `cursor`, `limit` — vertical full-screen pager |
| `POST /videos/:id/like` | Double-tap + button |
| `POST /videos/:id/dislike` | |
| `POST /videos/:id/save` | |
| `POST /videos/:id/view` | On visible slide |
| `GET /videos/:id/comments` | Bottom sheet |
| `POST /videos/:id/comments` | |
| `GET /ads/serve?placement=shorts_interstitial` | Every N swipes from config |

**Implementation:**

- `FlashList` vertical `pagingEnabled` OR `FlatList` with `snapToInterval`
- Preload next/prev HLS
- Mute toggle, creator overlay, follow CTA
- Interstitial ad full-screen between items (respect `adFree` for premium)

**Deep link:** `shorts?start={videoId}` — scroll to index

---

### 12.4 Movies (`/(tabs)/movies`)

**Web ref:** [`app/movies/page.tsx`](../app/movies/page.tsx)

| Endpoint | Usage |
|----------|-------|
| `GET /videos/feed/movies` | Grid |
| `GET /videos/feed/movies/featured` | Hero |
| `GET /categories/movies` | Genre filters |

**Player:** `movie/[id]` with preroll ad (`movie_preroll` placement) before playback.

---

### 12.5 Verticals (`/(tabs)/verticals`)

**Web ref:** [`app/verticals/page.tsx`](../app/verticals/page.tsx), [`app/verticals/[slug]/page.tsx`](../app/verticals/[slug]/page.tsx)

| Screen | Endpoints |
|--------|-----------|
| Series list | `GET /verticals` |
| Series detail | `GET /verticals/:slug` |
| Episode player | `GET /verticals/:slug/episodes/:episodeNumber` |
| Engagement | `POST .../view`, `/like`, `/dislike`, `/save` |
| Series save | `POST /verticals/series/:seriesId/save` |
| Episode gate ad | `GET /ads/serve?placement=vertical_episode` |

**Player UX:** Episodic vertical video; auto-advance next episode; progress via `POST /history/progress` with `contentType: vertical_episode`.

---

### 12.6 Podcasts (`/(tabs)/podcasts`)

**Web ref:** [`app/podcasts/page.tsx`](../app/podcasts/page.tsx), [`app/podcast/[id]/page.tsx`](../app/podcast/[id]/page.tsx)

| Endpoint | Notes |
|----------|-------|
| `GET /podcasts/shows` | Browse shows |
| `GET /podcasts/shows/featured`, `/trending` | Rows |
| `GET /podcasts/episodes/feed` | Latest episodes |
| `GET /podcasts/episodes/:id` | Detail |
| `POST /podcasts/episodes/:id/play` | Analytics |
| `POST .../like`, `/dislike`, `/save` | |

**Audio:** Background playback + lock screen controls (`expo-av` or RN Video audio mode).  
**Video podcasts:** `mediaType === 'video'` → full video player with `videoUrl`.

---

### 12.7 Live streams

**Web ref:** [`app/live/[id]/page.tsx`](../app/live/[id]/page.tsx), [`app/go-live/page.tsx`](../app/go-live/page.tsx)

| Viewer | Endpoint / WS |
|--------|---------------|
| Live list | `GET /streams/live` |
| Stream detail | `GET /streams/:id` (UUID or username) |
| Playback | `hlsPlaybackUrl` in HLS player |
| Chat | Socket.IO `/streams` — `join`, `history`, `message`, `gift`, `streamEnded` |
| Gifts | `POST /billing/gifts/send` with `streamId` |
| End | Listen `streamEnded` event |

| Creator (approved streamer) | Endpoint |
|----------------------------|----------|
| Go Live setup | `POST /streams/init`, `GET /streams/ingest/health` |
| End stream | `POST /streams/:id/end` |
| RTMP instructions | Display from init response |

**Native:** Keep screen awake during live; low-latency HLS; chat input docked above keyboard.

---

### 12.8 Watch / Movie player (long-form)

**Web ref:** [`app/watch/[id]/page.tsx`](../app/watch/[id]/page.tsx), [`app/movie/[id]/page.tsx`](../app/movie/[id]/page.tsx)

| Feature | Endpoint |
|---------|----------|
| Detail | `GET /videos/:id` |
| View count | `POST /videos/:id/view` |
| Progress | `POST /history/progress` (debounce 10s) |
| Like/dislike/save | POST toggles |
| Comments | `GET/POST /videos/:id/comments`, comment likes |
| Report | `POST /videos/:id/report` or `POST /reports` |
| Share | Native share sheet |

**Player controls:** Play/pause, seek, fullscreen, PiP, quality (if multi-variant HLS), captions (future).

---

### 12.9 Search

**Web ref:** [`components/search-modal.tsx`](../components/search-modal.tsx)

| Endpoint | Usage |
|----------|-------|
| `GET /search/suggest` | Debounced 300ms autocomplete |
| `GET /search` | Full results — videos, movies, creators, podcasts, verticals |

**UI:** Tabs by result type; recent searches in AsyncStorage.

---

### 12.10 Creator public profile

**Web ref:** [`app/creator/[slug]/page.tsx`](../app/creator/[slug]/page.tsx)

| Endpoint | Feature |
|----------|---------|
| `GET /users/:username` | Header, bio, counts, `isLive`, `hasStore` |
| `GET /users/:username/videos` | Uploads grid |
| `GET /users/:username/playlists` | Public playlists |
| `GET /users/:username/store` | Store tab (if `hasStore`) |
| `POST/DELETE /users/:username/follow` | Follow button |
| `POST /users/:username/live-alerts` | Notify bell |
| `POST /billing/subscriptions/create` | Channel membership tiers |
| Gifts | `POST /billing/gifts/send` + catalog `GET /billing/gifts/catalog` |

**Tabs:** Videos | Shorts | Playlists | Store (conditional) | About

---

### 12.11 Profile (authenticated)

**Web ref:** [`app/profile/page.tsx`](../app/profile/page.tsx)

| Tab | Endpoint |
|-----|----------|
| My content | `GET /users/me/videos` |
| Playlists | `GET /playlists/me` |
| Saved | `GET /users/me/saved` |
| Liked | `GET /users/me/liked` |
| Store (approved) | `GET/PUT /stores/me`, product CRUD |

**Header actions:** Edit profile, share profile, settings, coins balance, creator unlock tiles.

**Settings menu screens:**

| Screen | Endpoint / behavior |
|--------|---------------------|
| Edit profile | `PUT /users/me`, avatar/banner upload |
| Notifications prefs | `GET/PUT /users/me/notification-preferences` |
| Social links | `PUT /users/me/social-links` |
| History | `GET /history`, clear, per-item delete |
| Premium | `GET /billing/products`, Stripe checkout |
| Help | Static + mailto |
| Go Live | → `go-live` screen |
| Upload | → `upload` screen |
| Creator dashboard | → `creator-dashboard` |
| Logout | `POST /auth/logout` |

**Creator access unlock:** `POST /users/request-creator-access` with `features: ['live','vertical','store']` — mirror web unlock modal.

**Streamer apply:** `POST /users/apply-streamer` + ID upload `POST /users/me/streamer-id/upload`.

---

### 12.12 Playlists

**Web ref:** [`app/playlist/[id]/page.tsx`](../app/playlist/[id]/page.tsx)

| Action | Endpoint |
|--------|----------|
| Discover | `GET /playlists/discover` |
| CRUD | `GET/POST/PUT/DELETE /playlists/:id` |
| Items | `POST/DELETE /playlists/:id/items`, `PUT .../reorder` |

---

### 12.13 Notifications (in-app)

**Web ref:** header bell + [`app/settings/notifications/page.tsx`](../app/settings/notifications/page.tsx)

| Endpoint | Usage |
|----------|-------|
| `GET /users/me/notifications` | Paginated list |
| `PUT .../:id/read` | Mark read |
| `PUT .../read-all` | |
| `DELETE /users/me/notifications` | Clear all |

**Tap routing:** Implement [`route-from-notification.ts`](#132-push-notifications-native) mapping table from api.md.

---

### 12.14 Premium & coins

**Web ref:** [`app/premium/page.tsx`](../app/premium/page.tsx), profile coins modal

| Product | Flow |
|---------|------|
| Coins | `POST /billing/stripe/create-checkout` `productType: "coins"` → WebBrowser → `POST /billing/stripe/fulfill` |
| Premium | Same with `productType: "premium"` |
| Dev mode | API grants without Stripe when not configured |

**UI:** Show `coinsBalance`, `premiumTier`, `premiumExpiresAt` from `GET /users/me`.

---

### 12.15 Advertise (B2B)

**Web ref:** [`app/advertise/page.tsx`](../app/advertise/page.tsx)

| Endpoint | Usage |
|----------|-------|
| `GET /advertisers/me` | List accounts |
| `POST /advertisers/register` | Modal form — email validation, one pending |
| `DELETE /advertisers/me/:id` | Cancel pending |

**Note:** Campaign management remains admin-only; mobile shows registration + status only.

---

### 12.16 Legal & help

Static screens mirroring web markdown content:

- `terms.tsx`, `privacy.tsx`, `cookies.tsx`, `guidelines.tsx`, `help.tsx`

Load from bundled copy or `WebView` to production URLs.

---

### 12.17 Reporting

`POST /reports` — `{ targetType, targetId, reason, details? }` from player, profile, comments.

---

## 13. Native & mobile-only enhancements

### 13.1 Push notifications

| Step | Action |
|------|--------|
| 1 | Request permission on first login (not on cold launch) |
| 2 | `expo-notifications.getExpoPushTokenAsync()` |
| 3 | **Backend:** store token on user — *if no endpoint exists yet, add `PUT /users/me/push-token` as Phase 2 API task*; until then, in-app notifications only |
| 4 | Handle foreground: `addNotificationReceivedListener` → update badge |
| 5 | Handle tap: `addNotificationResponseReceivedListener` → `router.push()` |

**Notification → screen table** (from api.md):

| `type` | Route |
|--------|-------|
| `follow` | `/creator/[username]` |
| `like`, `comment` | Resolve via `metadata.videoType` / `contentType` |
| `live` | `/live/[referenceId]` |
| `gift` | `/live/[referenceId]` or creator profile |
| `upload` | `/watch/[videoId]` or shorts |
| `system` | `/settings/notifications` or in-app modal |

### 13.2 Background audio (podcasts)

- Enable background mode in `app.config.ts` (`UIBackgroundModes: audio`).
- Lock screen: `expo-av` `setOnPlaybackStatusUpdate` → MediaSession metadata (title, show cover).

### 13.3 Picture-in-Picture

- Long-form and live: enter PiP on home button (iOS/Android).
- Pause main player when PiP closed.

### 13.4 Haptics

- `Light` impact: like, save, follow
- `Medium`: gift sent
- `Success`: purchase fulfill, upload complete

### 13.5 Share sheet

Use [`lib/share-links.ts`](../lib/share-links.ts) patterns:

- Video → `https://srv1765056.hstgr.cloud/watch/{id}`
- Creator → `/creator/{username}`
- Include app download CTA in share text

### 13.6 Biometrics (optional v1.1)

- `expo-local-authentication` — unlock app after background > 5 min

### 13.7 Orientation

| Context | Orientation |
|---------|-------------|
| Shorts, verticals | Portrait locked |
| Movies, long-form | Sensor landscape + portrait |
| Live | Portrait default, landscape on fullscreen |

### 13.8 App icon badge

Unread notification count from `GET /users/me/notifications?unreadOnly=1` (if supported) or count `isRead === false` client-side.

---

## 14. Ads, billing & monetization

### 14.1 Ad placements (must match web)

| Placement | Where | Endpoints |
|-----------|-------|-----------|
| `home_banner` | Home row | serve → impression → click |
| `shorts_interstitial` | Every N shorts | `GET /config/public` for N |
| `movie_preroll` | Before movie HLS | peek=1 check first |
| `vertical_episode` | Before episode | |

**Premium:** Bearer token → `{ ad: null, adFree: true }` — skip all placements.

### 14.2 Revenue events

Creators: dashboard uses `GET /analytics/creators/me/dashboard` — no mobile changes needed.

---

## 15. Creator tools & uploads

### 15.1 Upload hub (`upload.tsx`)

**Web ref:** [`app/upload/page.tsx`](../app/upload/page.tsx)

Support upload types:

| Type | Init endpoint | Complete |
|------|---------------|----------|
| Video/Short/Movie | `POST /videos/upload/init` | `POST /videos/upload/complete` |
| Podcast episode | `POST /podcasts/episodes/:id/upload/init` | complete |
| Podcast cover | `POST /podcasts/shows/:id/cover/upload/init` | complete |
| Vertical episode | `PUT /verticals/episodes/:episodeId/video` | |
| Avatar/Banner | `POST /users/me/avatar/upload` | PUT to presigned URL |

**UX:** Pick file → show progress bar → poll processing status on video record → success → link to content.

Use `react-native-blob-util` for multipart/local POST fallback when `STORAGE_DRIVER=local`.

### 15.2 Creator dashboard (`creator-dashboard.tsx`)

**Web ref:** [`components/creator-dashboard-panel.tsx`](../components/creator-dashboard-panel.tsx)

| Section | API |
|---------|-----|
| Performance | `GET /analytics/creators/me/dashboard` |
| Payout profile | `GET/PUT /billing/creators/payout-profile` |
| Request payout | `POST /billing/creators/payouts/request` |
| Balance | `GET /billing/creators/balance` |

### 15.3 Podcast & vertical management

Mirror web create flows:

- Podcasts: `POST /podcasts/shows`, `POST .../episodes`
- Verticals (approved creators): `GET /verticals/me/series`, `POST /verticals/series`, episode CRUD

### 15.4 Store seller panel

**Web ref:** [`components/profile-store-panel.tsx`](../components/profile-store-panel.tsx)

| API | Action |
|-----|--------|
| `GET /stores/me` | Store + products |
| `PUT /stores/me` | Display name, description |
| `POST/PUT/DELETE /stores/me/products` | Product CRUD |

---

## 16. Admin panel (role-gated)

**Access:** Only if `user.role === 'admin'`. Add entry in Profile settings → "Admin console".

Mirror **every** web admin route under `app/(admin)/`. Port logic from [`lib/api/admin.ts`](../lib/api/admin.ts).

### 16.1 Admin modules

| Module | Web path | Key endpoints |
|--------|----------|---------------|
| Dashboard | `/admin` | `GET /admin/analytics/overview` |
| Users | `/admin/users` | list, detail, ban, verify, coins, impact |
| Applications | `/admin/applications` | streamer, vertical, store review |
| Content | `/admin/content/*` | videos, shorts, movies, verticals, podcasts, comments |
| Moderation | `/admin/moderation` | reports queue |
| Ads | `/admin/ads` | campaigns CRUD, analytics, media upload |
| Advertisers | `/admin/advertisers` | B2B verify |
| Payouts | `/admin/payouts` | approve/reject |
| Revenue | `/admin/revenue` | ledger |
| GAF | `/admin/gaf` | ledger |
| Economy | `/admin/economy` | gifts, transactions |
| Config | `/admin/config/*` | economy, ads, programs, genres, categories |
| Live | `/admin/live` | kill streams, history |
| Store products | `/admin/store-products` | global product list |
| Audit log | `/admin/audit-log` | read-only |

**UI note:** Use tablet two-pane layouts where possible (list + detail); phone uses stack navigation.

---

## 17. Deep linking & universal links

### 17.1 URL scheme

```
prysymtv://watch/abc-uuid
prysymtv://creator/username
prysymtv://live/stream-uuid
prysymtv://shorts?start=uuid
https://srv1765056.hstgr.cloud/...  (universal links — optional Phase 2)
```

### 17.2 Expo Router linking config

Map web paths 1:1 where possible (see api.md React Native screen mapping table).

### 17.3 Auth deep links

- `reset-password?token=...` → `(auth)/reset-password`
- Stripe return: `prysymtv://billing/success?session_id=...` → fulfill + navigate to profile

---

## 18. Offline, caching & performance

| Strategy | Implementation |
|----------|----------------|
| Feed images | `expo-image` disk cache |
| API responses | TanStack Query cache + `AsyncStorage` persist (optional) |
| Continue watching | Optimistic local merge with server history on reconnect |
| Shorts | Preload next 2 HLS manifests |
| Error UX | Network banner; retry button on failed queries |

**No offline playback** in v1.

---

## 19. Testing strategy

### 19.1 Manual test matrix (per release)

- [ ] Auth: register, login, refresh after 15 min, logout
- [ ] Guest browse: home, shorts swipe, movie detail
- [ ] Engagement: like, comment, save, follow (auth)
- [ ] Live: join stream, send chat, receive gift event
- [ ] Podcast: background audio continues on lock screen
- [ ] Upload: pick video, complete flow, appears in profile
- [ ] Stripe: coins purchase (test mode)
- [ ] Ads: shorts interstitial shows for non-premium
- [ ] Premium: ads skipped when subscribed
- [ ] Push: tap notification opens correct screen
- [ ] Admin: approve one application end-to-end

### 19.2 Device matrix

- Android 13+ (phone)
- iOS 16+ (phone)
- iPad / Android tablet (admin layouts)

### 19.3 Automated tests (Phase 2)

- Jest unit tests for `src/api/client.ts`, auth refresh logic
- Maestro / Detox E2E for login → home → play short

---

## 20. Phased delivery schedule

### Phase 0 — Foundation (Week 1)

- [ ] Expo Router + theme + API client + auth (login/register/refresh/logout)
- [ ] Tab shell with placeholder screens
- [ ] `GET /health`, `GET /users/me`

### Phase 1 — Viewer core (Weeks 2–4)

- [ ] Home feed
- [ ] Shorts player (full engagement)
- [ ] Videos browse + watch player
- [ ] Movies browse + preroll
- [ ] Search
- [ ] Creator public profile + follow
- [ ] Auth-gated library (saved, liked, history)

### Phase 2 — Audio & episodic (Weeks 5–6)

- [ ] Podcasts browse + audio background player
- [ ] Verticals series + episode player + gate ads
- [ ] Live viewer + chat + gifts

### Phase 3 — Monetization (Week 7)

- [ ] Coins + premium Stripe checkout
- [ ] Channel memberships
- [ ] Ads all placements
- [ ] Notifications in-app list + prefs

### Phase 4 — Creator (Weeks 8–9)

- [ ] Upload flows (video, podcast, vertical)
- [ ] Go Live
- [ ] Creator dashboard + payouts
- [ ] Store seller panel
- [ ] Creator access applications

### Phase 5 — Native polish (Week 10)

- [ ] Push notifications (requires API token endpoint if missing)
- [ ] PiP, haptics, share sheet
- [ ] Deep links
- [ ] Performance pass (FlashList, image cache)

### Phase 6 — Admin (Weeks 11–13)

- [ ] Full admin console per §16
- [ ] Tablet layouts

### Phase 7 — Store release (Week 14)

- [ ] Upgrade Expo SDK per NOTE.md
- [ ] EAS production builds
- [ ] App Store / Play Store assets, privacy nutrition labels
- [ ] Production env pointing to `srv1765056.hstgr.cloud`

---

## 21. Definition of done

The mobile app is **v1 complete** when:

1. Every row in [Appendix A](#appendix-a--screen--route--api-map) has a shipped screen.
2. All ✅ endpoints in api.md used by web are called correctly from mobile.
3. Auth refresh works for 7+ days without re-login.
4. Shorts, live, and podcast playback work on physical devices.
5. Creator can upload a video and see it on their profile.
6. Admin can approve a streamer application from phone/tablet.
7. Crash-free sessions > 99% in TestFlight / internal testing track.

---

## Appendix A — Screen → route → API map

| Mobile route | Web equivalent | Primary APIs |
|--------------|----------------|--------------|
| `/(tabs)/home` | `/` | `/feed/home`, `/history`, `/ads/serve` |
| `/(tabs)/videos` | `/videos` | `/videos/feed/videos` |
| `/(tabs)/shorts` | `/shorts` | `/videos/feed/shorts`, engagement |
| `/(tabs)/movies` | `/movies` | `/videos/feed/movies` |
| `/(tabs)/verticals` | `/verticals` | `/verticals` |
| `/(tabs)/podcasts` | `/podcasts` | `/podcasts/shows`, `/episodes/feed` |
| `/watch/[id]` | `/watch/[id]` | `/videos/:id`, comments, progress |
| `/movie/[id]` | `/movie/[id]` | `/videos/:id`, preroll ad |
| `/live/[id]` | `/live/[id]` | `/streams/:id`, Socket.IO |
| `/podcast/[id]` | `/podcast/[id]` | `/podcasts/episodes/:id` |
| `/verticals/[slug]` | `/verticals/[slug]` | `/verticals/:slug` |
| `/verticals/watch/[slug]/[ep]` | `/verticals/watch/...` | episode endpoint |
| `/creator/[username]` | `/creator/[slug]` | `/users/:username` + videos |
| `/playlist/[id]` | `/playlist/[id]` | `/playlists/:id` |
| `/profile` | `/profile` | `/users/me/*` |
| `/history` | `/history` | `/history` |
| `/premium` | `/premium` | `/billing/products`, stripe |
| `/advertise` | `/advertise` | `/advertisers/*` |
| `/go-live` | `/go-live` | `/streams/init` |
| `/upload` | `/upload` | upload init/complete |
| `/creator-dashboard` | `/creator/dashboard` | `/analytics/creators/me/dashboard` |
| `/search` | search modal | `/search`, `/search/suggest` |
| `/(admin)/*` | `/admin/*` | `/admin/*` |
| `/(auth)/login` | auth modal | `/auth/login` |
| `/(auth)/register` | auth modal | `/auth/register` |
| `/(auth)/forgot-password` | auth modal | `/auth/forgot-password` |
| `/(auth)/reset-password` | `/reset-password` | `/auth/reset-password` |
| `/settings/notifications` | `/settings/notifications` | notification prefs |
| `/terms`, `/privacy`, etc. | legal pages | static |

---

## Appendix B — Dependency install list

Run from `mobile/` when starting Phase 0:

```bash
# Navigation & core
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# State & forms
npm install @tanstack/react-query zustand react-hook-form zod @hookform/resolvers

# Auth & storage
npx expo install expo-secure-store @react-native-cookies/cookies

# Media
npx expo install expo-image expo-av expo-video
npm install react-native-video @shopify/flash-list react-native-reanimated react-native-gesture-handler

# Network & realtime
npm install socket.io-client
npm install react-native-blob-util  # upload progress

# UI
npm install lucide-react-native react-native-svg

# Native features
npx expo install expo-notifications expo-device expo-haptics expo-sharing expo-web-browser expo-document-picker expo-image-picker expo-localization

# Dev
npm install -D @types/react eslint prettier
```

---

## Appendix C — Web file porting index

When implementing a mobile screen, open these web files side-by-side:

| Mobile screen | Primary web files |
|---------------|-------------------|
| Home | `app/page.tsx`, `components/content-row.tsx`, `components/featured-live.tsx` |
| Shorts | `app/shorts/page.tsx` |
| Watch | `app/watch/[id]/page.tsx`, `components/video-player*.tsx` |
| Live | `app/live/[id]/page.tsx`, `lib/api/stream-chat.ts` |
| Profile | `app/profile/page.tsx`, `components/profile-*.tsx` |
| Creator profile | `app/creator/[slug]/page.tsx`, `components/creator-store-tab.tsx` |
| Upload | `app/upload/page.tsx` |
| Dashboard | `components/creator-dashboard-panel.tsx` |
| Advertise | `app/advertise/page.tsx`, `components/advertiser-register-modal.tsx` |
| Admin | `app/admin/**`, `components/admin/**`, `lib/api/admin.ts` |

---

## Document maintenance

When the API changes:

1. Update [`../guides-md-files/api.md`](../guides-md-files/api.md) first — it holds the complete endpoint index and payload documentation.
2. Update Appendix A in this file.
3. Update affected `src/api/*` modules.

When product behavior is unclear:

1. Reproduce the flow on the **web frontend** (same repo) and read the page + components listed in [Appendix C](#appendix-c--web-file-porting-index).
2. Confirm the API contract in `api.md` before changing mobile-only logic.

---

*Plan version: 2026-07-03 — aligned with PrysymTV `main` @ advertiser modal + pending registration flow.*

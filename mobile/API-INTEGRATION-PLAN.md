# PrysymTV Mobile — API Integration Plan

**Purpose:** Wire the Expo mobile app to the real Prysym TV backend. Replace mock data with live API calls while keeping UI screens mostly unchanged.

**Status:** In progress — auth layer partial; all content/monetization screens still use `@/mocks`.

**Canonical API reference:** [`../guides-md-files/api.md`](../guides-md-files/api.md)  
**Web API modules to port:** [`../lib/api/`](../lib/api/)  
**Web screens to mirror:** [`../app/`](../app/), [`../components/`](../components/)

**Production API:** `https://srv1765056.hstgr.cloud/api/v1`  
**WebSocket host:** `https://srv1765056.hstgr.cloud` (Socket.IO namespace `/streams`)

---

## Table of contents

1. [Current state](#1-current-state)
2. [Principles](#2-principles)
3. [Phase 0 — Foundation (do first)](#phase-0--foundation-do-first)
4. [Phase 1 — Auth & account](#phase-1--auth--account)
5. [Phase 2 — Home & discovery feeds](#phase-2--home--discovery-feeds)
6. [Phase 3 — Content detail & playback](#phase-3--content-detail--playback)
7. [Phase 4 — Creator profiles & social](#phase-4--creator-profiles--social)
8. [Phase 5 — Profile, library & notifications](#phase-5--profile-library--notifications)
9. [Phase 6 — Monetization & billing](#phase-6--monetization--billing)
10. [Phase 7 — Ads](#phase-7--ads)
11. [Phase 8 — Creator tools & uploads](#phase-8--creator-tools--uploads)
12. [Phase 9 — Advertisers (B2B)](#phase-9--advertisers-b2b)
13. [API modules to add](#api-modules-to-add)
14. [Mock removal checklist](#mock-removal-checklist)
15. [Screen → API quick reference](#screen--api-quick-reference)
16. [Definition of done](#definition-of-done)

---

## 1. Current state

### Already wired (real API)

| Area | Files | Endpoints |
|------|-------|-----------|
| HTTP client | `src/lib/api/client.ts` | `fetch`, Bearer token, 401 → refresh |
| Config | `src/lib/api/config.ts`, `app.json` `extra.apiUrl` | Base URL resolution |
| Auth | `src/lib/api/auth.ts` | login, register, logout, refresh, OAuth google/apple/facebook |
| Users | `src/lib/api/users.ts` | `GET /users/me`, creator applications |
| Public config | `src/lib/api/public-config.ts` | `GET /config/public` |
| Profile upload | `src/lib/api/profile-upload.ts` | streamer ID / banner init + multipart upload |
| Session | `src/context/MockAuthContext.tsx` | Hybrid: real API + silent mock fallback |
| OAuth config | `src/context/OAuthConfigContext.tsx` | OAuth client IDs from API |
| Streamer apply UI | `StreamerApplicationModal.tsx` | ID upload + apply endpoints |

### Still mock / local-only

| Area | Source |
|------|--------|
| All tab feeds (home, videos, shorts, movies, verticals, podcasts) | `@/mocks` |
| Search | Client filter over mocks |
| Watch, movie, shorts, podcast, vertical, live players | `@/mocks` |
| Creator profiles, store, cart | `@/mocks` + `StoreCartContext` |
| Comments, notifications | `mockComments`, `mockNotifications` |
| Premium, insider, gifts, coins, GAF, advertise | `@/mocks/monetization` |
| Ads UI | `src/components/ads/mock-ad-data.ts` |
| History, playlists, profile tabs | `@/mocks` |
| Forgot/reset password | `setTimeout` fake success |
| Edit profile | Local `updateProfile` only |

### Known gaps to fix before content work

1. **Refresh token** — API returns `refreshToken` in JSON; `POST /auth/refresh` accepts `{ refreshToken }`. Mobile client already sends body refresh token but must **persist `refreshToken` from login/OAuth responses** (today only access token is stored reliably).
2. **Mock auth fallback** — `MockAuthContext` signs in as `mockUser` when API login/OAuth fails. Remove for production integration (dev-only flag if needed).
3. **`preferMockSignIn`** — `login.tsx` and `register.tsx` force preview OAuth tokens. Remove when OAuth client IDs are configured via `GET /config/public`.
4. **No TanStack Query** — add caching, loading/error states, and refetch for all feeds.
5. **No Socket.IO client** — required for live chat.

---

## 2. Principles

1. **Port, don't reinvent** — Copy patterns from [`../lib/api/`](../lib/api/) and matching web pages.
2. **One module per API domain** — `feed.ts`, `videos.ts`, `podcasts.ts`, etc. under `mobile/src/lib/api/`.
3. **TanStack Query hooks** — `useHomeFeed()`, `useVideo(id)`, etc. in `mobile/src/hooks/api/`.
4. **Types from API** — Extend `mobile/src/types/api.ts` to mirror `lib/api/types.ts`.
5. **Optional JWT** — Send Bearer on feed/detail requests when logged in to get `liked`, `saved`, `isFollowing`.
6. **Delete mocks last** — Keep `@/mocks` until each screen's API path is verified on device.
7. **Reference web UX** — If behavior is unclear, trace the web screen listed in [Appendix C of DEVELOPMENT-PLAN.md](./DEVELOPMENT-PLAN.md).

---

## Phase 0 — Foundation (do first)

**Goal:** Reliable auth, shared data layer, API modules scaffold.

- [ ] **0.1** Install dependencies:
  ```bash
  cd mobile
  npm install @tanstack/react-query socket.io-client
  npx expo install expo-secure-store
  ```
- [ ] **0.2** Store tokens in `expo-secure-store` (access + refresh); keep AsyncStorage migration for existing users.
- [ ] **0.3** Fix `client.ts` / `auth.ts`:
  - Persist `refreshToken` from login, register, OAuth, and refresh responses.
  - On 401: `POST /auth/refresh` with `{ refreshToken }`, retry once.
- [ ] **0.4** Rename or split `MockAuthContext` → `AuthContext`; remove silent mock fallback (or gate behind `__DEV__ && EXPO_PUBLIC_MOCK_AUTH`).
- [ ] **0.5** Remove `preferMockSignIn` from `login.tsx` / `register.tsx` when `GET /config/public` → `auth` has real client IDs.
- [ ] **0.6** Add `QueryClientProvider` in `app/_layout.tsx`.
- [ ] **0.7** Port shared types from `../lib/api/types.ts` into `mobile/src/types/api.ts`.
- [ ] **0.8** Create API modules (stubs calling `apiRequest`) — see [API modules to add](#api-modules-to-add).
- [ ] **0.9** Add `getWsUrl()` in `config.ts` (`EXPO_PUBLIC_WS_URL` or derive from API host).
- [ ] **0.10** Create `src/lib/api/stream-chat.ts` — Socket.IO wrapper for `/streams` namespace.

**Exit criteria:** Login with email/password on production API → `GET /users/me` succeeds → app restart restores session via refresh token.

---

## Phase 1 — Auth & account

| Task | Screen / file | Endpoints |
|------|---------------|-----------|
| 1.1 | `(auth)/forgot-password.tsx` | `POST /auth/forgot-password` |
| 1.2 | `(auth)/reset-password.tsx` | `POST /auth/reset-password` |
| 1.3 | `EditProfileModal.tsx` | `PUT /users/me` |
| 1.4 | Avatar upload UI | `POST /users/me/avatar/upload` → `POST /media/profile-upload` |
| 1.5 | Banner upload UI | `POST /users/me/banner/upload` → `POST /media/profile-upload` |
| 1.6 | `settings/social.tsx` | `PUT /users/me/social-links` |
| 1.7 | `settings/shipping.tsx` | `PUT /users/me` (buyer fields) |
| 1.8 | `settings/notifications.tsx` | `GET/PUT /users/me/notification-preferences` |
| 1.9 | OAuth buttons | `POST /auth/oauth/google`, `/apple`, `/facebook` (already in `auth.ts`) |

**Exit criteria:** Full account settings round-trip on production API; OAuth works with client IDs from `GET /config/public`.

---

## Phase 2 — Home & discovery feeds

| Task | Screen | Endpoints | Replaces |
|------|--------|-----------|----------|
| 2.1 | `(tabs)/home.tsx` | `GET /feed/home` | All home mocks |
| 2.2 | Home continue watching | `GET /history` or feed payload | `mockContinueWatching` |
| 2.3 | `(tabs)/videos.tsx` | `GET /videos/feed/videos` | `mockVideos`, live slice |
| 2.4 | `(tabs)/shorts.tsx` | `GET /videos/feed/shorts` (cursor) | `mockShorts` |
| 2.5 | `(tabs)/movies.tsx` | `GET /videos/feed/movies`, `/movies/featured` | `mockMovies` |
| 2.6 | `(tabs)/verticals.tsx` | `GET /verticals` | `mockVerticals` |
| 2.7 | `(tabs)/podcasts.tsx` | `GET /podcasts/shows`, `/shows/featured`, `/shows/trending`, `/episodes/feed` | podcast mocks |
| 2.8 | `search.tsx` | `GET /search`, `GET /search/suggest` | client mock filter |
| 2.9 | `live/index.tsx` | `GET /streams/live` | `mockLiveStreams` |

**Hooks to add:** `useHomeFeed`, `useVideosFeed`, `useShortsFeed`, `useMoviesFeed`, `useVerticalsList`, `usePodcastsCatalog`, `useSearch`, `useLiveStreams`.

**Exit criteria:** All six tabs load real data from production API with loading/error/empty states.

---

## Phase 3 — Content detail & playback

| Task | Screen | Endpoints |
|------|--------|-----------|
| 3.1 | `watch/[id].tsx` | `GET /videos/:id`, `POST /videos/:id/view` |
| 3.2 | Watch progress | `POST /history/progress` |
| 3.3 | Watch engagement | `POST /videos/:id/like`, `/dislike`, `/save` |
| 3.4 | Comments | `GET/POST /videos/:id/comments`, comment like/delete |
| 3.5 | `movie/[id].tsx` | Same as watch + movie type |
| 3.6 | `shorts/[id].tsx` + shorts tab | Engagement per video; cursor feed |
| 3.7 | `podcast/[id].tsx` | `GET /podcasts/episodes/:id`, `POST …/play` |
| 3.8 | Podcast engagement | `POST …/like`, `/dislike`, `/save` |
| 3.9 | `verticals/[slug].tsx` | `GET /verticals/:slug` |
| 3.10 | `verticals/watch/...` | `GET /verticals/:slug/episodes/:episodeNumber` |
| 3.11 | Vertical engagement | view, like, dislike, save + `POST /history/progress` |
| 3.12 | `live/[id].tsx` | `GET /streams/:id` |
| 3.13 | Live chat | Socket.IO: `join`, `message`, `history`, `gift`, `streamEnded` |
| 3.14 | `playlist/[id].tsx` | `GET /playlists/:id` |
| 3.15 | All players | `react-native-video` with `hlsMasterUrl` / `playbackUrl` / `videoUrl` |

**Report:** `ReportModal` → `POST /reports`.

**Exit criteria:** Can play a video, short, movie, podcast episode, vertical episode, and live stream from production URLs.

---

## Phase 4 — Creator profiles & social

| Task | Screen | Endpoints |
|------|--------|-----------|
| 4.1 | `creator/[username].tsx` profile | `GET /users/:username` |
| 4.2 | Videos tab | `GET /users/:username/videos` |
| 4.3 | Playlists tab | `GET /users/:username/playlists` |
| 4.4 | Follow / unfollow | `POST/DELETE /users/:username/follow` |
| 4.5 | Live alerts bell | `POST /users/:username/live-alerts` |
| 4.6 | Channel membership | `POST /billing/subscriptions/create` |
| 4.7 | Store tab | `GET /users/:username/store` |
| 4.8 | Product detail | `GET /users/:username/store/products/:productId` |
| 4.9 | Cart + checkout | `POST /stores/checkout` → Stripe WebBrowser → `POST /billing/stripe/fulfill` |
| 4.10 | Seller panel | `GET /stores/me`, product CRUD, image upload |

**Exit criteria:** Follow a creator, view their videos, add store item to cart, complete Stripe checkout (or dev-mode grant).

---

## Phase 5 — Profile, library & notifications

| Task | Screen / component | Endpoints |
|------|-------------------|-----------|
| 5.1 | `profile.tsx` | `GET /users/me` |
| 5.2 | Continue watching | `GET /history` |
| 5.3 | Saved / liked | `GET /users/me/saved`, `/users/me/liked` |
| 5.4 | My videos | `GET /users/me/videos` |
| 5.5 | Playlists | `GET /playlists/me` |
| 5.6 | `history.tsx` | `GET /history`, delete/clear |
| 5.7 | `notifications.tsx`, `NotificationsSheet`, `AppHeader` badge | `GET /users/me/notifications`, mark read, read-all, delete |
| 5.8 | Notification taps | Map `type` + `metadata` → routes (see `api.md`) |
| 5.9 | `AddToPlaylistSheet` | `GET /playlists/me`, `POST /playlists/:id/items` |
| 5.10 | `settings/playlists.tsx` | Playlist CRUD |
| 5.11 | `ProfileMyContent` | Real creator content lists |

**Exit criteria:** Profile library matches web profile; notifications deep-link to correct screens.

---

## Phase 6 — Monetization & billing

| Task | Screen / component | Endpoints |
|------|-------------------|-----------|
| 6.1 | `CoinsModal` | `GET /billing/products`, `POST /billing/stripe/create-checkout` (`coins`) |
| 6.2 | `premium.tsx` | `create-checkout` (`premium`) |
| 6.3 | `insider.tsx` | `create-checkout` (`insider`) |
| 6.4 | `GiftModal`, `LiveGiftPanel` | `GET /billing/gifts/catalog`, `POST /billing/gifts/send` |
| 6.5 | Memberships UI | `GET /billing/subscriptions/me`, `DELETE …/:id` |
| 6.6 | Stripe flow | `expo-web-browser` → `POST /billing/stripe/fulfill` |
| 6.7 | `creator-dashboard.tsx`, `settings/dashboard.tsx` | `GET /analytics/creators/me/dashboard` |
| 6.8 | Payout settings (new or settings screen) | payout profile + `POST /billing/creators/payouts/request` |
| 6.9 | `impact.tsx` | Public programs / GAF content as available |

**Exit criteria:** Purchase coins on production (or dev-mode grant); send a gift; creator dashboard shows real stats.

---

## Phase 7 — Ads

| Task | Component | Endpoints |
|------|-----------|-----------|
| 7.1 | Config | `GET /config/public` → `ads` |
| 7.2 | `AdBanner` | `GET /ads/serve?placement=home_banner` |
| 7.3 | `AdPreroll` | `placement=movie_preroll` |
| 7.4 | `AdInterstitial` | `placement=shorts_interstitial` |
| 7.5 | `VerticalEpisodeAdGate` | `placement=vertical_episode&peek=1` |
| 7.6 | Tracking | `POST /ads/track/impression`, `/track/click` |
| 7.7 | Premium ad-free | Bearer on serve → skip when `adFree: true` |

**Exit criteria:** Delete `mock-ad-data.ts`; ads load from API or gracefully hide when `ad: null`.

---

## Phase 8 — Creator tools & uploads

| Task | Screen | Endpoints |
|------|--------|-----------|
| 8.1 | `go-live.tsx` | `POST /streams/init`, `GET /streams/ingest/health` |
| 8.2 | End stream | `POST /streams/:id/end` |
| 8.3 | Video upload | `POST /videos/upload/init` → upload → `complete` |
| 8.4 | Movie poster | `POST /videos/:id/poster/upload/*` |
| 8.5 | `settings/upload.tsx` | Wire real publish flow |
| 8.6 | `settings/verticals.tsx` | `GET /verticals/me/series`, create series/episodes |
| 8.7 | `settings/podcasts.tsx` | `GET /podcasts/shows/me`, episode upload flow |
| 8.8 | Store product images | `POST /stores/me/products/images/upload/*` |
| 8.9 | `CreateMenuModal` | Gate on `streamerStatus`, `verticalCreatorStatus`, `storeCreatorStatus` from `GET /users/me` |

**Exit criteria:** Approved creator can upload a video and go live against production ingest URLs.

---

## Phase 9 — Advertisers (B2B)

| Task | Screen | Endpoints |
|------|--------|-----------|
| 9.1 | `advertise.tsx` | `POST /advertisers/register`, `GET /advertisers/me` |
| 9.2 | Cancel pending | `DELETE /advertisers/me/:id` |
| 9.3 | `advertise/portal/[accountId].tsx` | `GET /advertisers/me/:id` |

**Exit criteria:** Register advertiser account; view campaigns when verified.

---

## API modules to add

Create under `mobile/src/lib/api/` (port from `../lib/api/`):

```
feed.ts              GET /feed/home, /feed/trending
videos.ts            GET /videos/:id, engagement, comments, upload, PATCH
videos-feed.ts       GET /videos/feed/shorts, /movies, /videos
podcasts.ts          shows, episodes, engagement, upload
verticals.ts         series, episodes, engagement, creator series
streams.ts           live list, detail, init, end, ingest health
stream-chat.ts       Socket.IO client
history.ts           GET /history, progress, delete
search.ts            GET /search, /search/suggest
playlists.ts         CRUD + items
notifications.ts     in-app notifications
billing.ts           products, checkout, fulfill, gifts, subscriptions
billing-monetization.ts  creator balance, payouts
stores.ts            store me, products, checkout, orders
ads.ts               serve, track impression/click
analytics.ts         creator dashboard
reports.ts           POST /reports
advertisers.ts       B2B registration
categories.ts        video/movie/podcast categories
comments.ts          shared comment helpers (optional)
```

Add matching hooks in `mobile/src/hooks/api/`:

```
useHomeFeed.ts
useVideo.ts
useShortsFeed.ts
usePodcastEpisode.ts
useVerticalSeries.ts
useLiveStream.ts
useCreatorProfile.ts
useNotifications.ts
useHistory.ts
...
```

---

## Mock removal checklist

Remove imports from `@/mocks` as each phase completes:

| Mock export | Remove after phase |
|-------------|-------------------|
| `mockVideos`, `mockShorts`, `mockMovies` | Phase 2–3 |
| `mockLiveStreams`, `mockChatMessages` | Phase 2–3 |
| `mockVerticals`, `getMockVertical` | Phase 2–3 |
| `mockPodcastShows`, `mockPodcastEpisodes` | Phase 2–3 |
| `mockCreatorProfile` | Phase 4 |
| `mockStoreProducts`, `getMockStoreProduct` | Phase 4 |
| `mockPlaylists` | Phase 5 |
| `mockNotifications` | Phase 5 |
| `mockComments` | Phase 3 |
| `mockContinueWatching` | Phase 2 |
| `mockUser` (auth fallback) | Phase 0 |
| `mock-ad-data.ts` | Phase 7 |
| `monetization.ts` mocks | Phase 6, 9 |

Keep `src/mocks/` folder until **Definition of done** below; then delete or move to `__tests__/fixtures/`.

---

## Screen → API quick reference

| Mobile route | Primary endpoints |
|--------------|-------------------|
| `(tabs)/home` | `/feed/home`, `/history`, `/ads/serve?placement=home_banner` |
| `(tabs)/videos` | `/videos/feed/videos` |
| `(tabs)/shorts` | `/videos/feed/shorts`, engagement, shorts ad |
| `(tabs)/movies` | `/videos/feed/movies`, `/movies/featured` |
| `(tabs)/verticals` | `/verticals` |
| `(tabs)/podcasts` | `/podcasts/shows`, `/episodes/feed` |
| `/watch/[id]` | `/videos/:id`, comments, progress, engagement |
| `/movie/[id]` | `/videos/:id`, movie preroll ad |
| `/live/[id]` | `/streams/:id`, Socket.IO `/streams` |
| `/podcast/[id]` | `/podcasts/episodes/:id` |
| `/verticals/[slug]` | `/verticals/:slug` |
| `/verticals/watch/[slug]/[ep]` | episode by number, vertical ad gate |
| `/creator/[username]` | `/users/:username`, videos, store, follow |
| `/playlist/[id]` | `/playlists/:id` |
| `/profile` | `/users/me/*`, `/history`, `/playlists/me` |
| `/search` | `/search`, `/search/suggest` |
| `/premium`, `/insider` | `/billing/stripe/create-checkout` |
| `/go-live` | `/streams/init` |
| `/creator-dashboard` | `/analytics/creators/me/dashboard` |
| `/advertise` | `/advertisers/*` |
| `(auth)/*` | `/auth/*` |

Full index: [`../guides-md-files/api.md`](../guides-md-files/api.md).

---

## Definition of done

Mobile API integration is **complete** when:

1. No production screen imports from `@/mocks` for primary data.
2. Auth session survives app restart via refresh token.
3. All six tabs load from production API.
4. Video, short, movie, podcast, vertical, and live playback use real HLS/audio URLs.
5. Engagement (like, save, comment, gift) hits real endpoints.
6. Stripe checkout works for coins, premium, and insider (WebBrowser + fulfill).
7. Creator upload and go-live work for approved users.
8. Notifications load from API and deep-link correctly.
9. Ads serve from API or hide when `adFree` / `ad: null`.
10. `api.md` is the contract; any drift is fixed in mobile client, not by re-mocking.

---

## Suggested work order (sprints)

| Sprint | Focus |
|--------|-------|
| **Sprint 1** | Phase 0 + Phase 1 |
| **Sprint 2** | Phase 2 (all tabs) |
| **Sprint 3** | Phase 3 (watch, shorts, movie) |
| **Sprint 4** | Phase 3 (podcast, vertical, live + chat) |
| **Sprint 5** | Phase 4 + 5 (creator, profile, notifications) |
| **Sprint 6** | Phase 6 + 7 (billing, ads) |
| **Sprint 7** | Phase 8 + 9 (creator tools, advertisers) |
| **Sprint 8** | Mock deletion, polish, error states, pull-to-refresh |

---

## Document maintenance

When the API changes:

1. Update [`../guides-md-files/api.md`](../guides-md-files/api.md) first.
2. Update the matching `mobile/src/lib/api/*` module.
3. Check off tasks in this file.

---

*Plan version: 2026-07-10 — aligned with production API, OAuth implemented, refresh token in JSON, mock-heavy mobile scaffold.*

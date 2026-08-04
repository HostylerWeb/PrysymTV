# PrysymTV Admin Dashboard — Full Implementation Plan

**Status:** Planning document (not started)  
**Last updated:** 2026-05-31 (platform config + scorecard + content categories strategy)  
**Related:** [`backend-development-plan.md`](../api/backend-development-plan.md) §7, [`api.md`](../api/api.md) Admin section, [`stakeholder-product-requirements.md`](./stakeholder-product-requirements.md)

This is the canonical blueprint for the PrysymTV **operator console**: every page, tab, action, API dependency, and implementation checkbox. Work through phases in order unless a blocker forces a reorder.

---

## Table of contents

1. [Goals & scope](#1-goals--scope)
2. [Architecture](#2-architecture)
3. [API inventory (current vs required)](#3-api-inventory-current-vs-required)
4. [Navigation map](#4-navigation-map)
5. [Global UI patterns](#5-global-ui-patterns)
6. [Page specifications](#6-page-specifications)
7. [Core workflows](#7-core-workflows)
8. [Security, permissions & audit](#8-security-permissions--audit)
9. [Implementation phases & master checklist](#9-implementation-phases--master-checklist)
10. [Frontend file structure](#10-frontend-file-structure)
11. [QA & launch checklist](#11-qa--launch-checklist)
12. [Platform configuration hub (admin-editable, no deploys)](#12-platform-configuration-hub-admin-editable-no-deploys)
13. [Content pillars as categories (consumer UX — no new silos)](#13-content-pillars-as-categories-consumer-ux--no-new-silos)

---

## 1. Goals & scope

### 1.1 What the admin dashboard is

A **web-only operator console** for PrysymTV staff with `users.role = admin`. It is not a creator tool (that lives in profile/settings/creator dashboard). It is not a public page.

Primary jobs:

| Job | Why it matters before launch |
|-----|------------------------------|
| Review user-submitted **reports** | Legal/safety; users already file reports from watch, podcast, vertical pages |
| Approve **streamer applications** | Go Live is gated on `streamer_status = approved` |
| **Kill** abusive live streams | Real-time harm mitigation |
| **Ban** bad actors & remove content | Enforcement |
| Process **creator payout** requests | Money leaves the platform — needs human approval |
| Manage **ad campaigns** | Private ad network (no AdSense) |
| Tune **revenue split rules** | Stakeholder splits must be editable without code deploys |
| **Platform configuration** | Ad behavior, economy knobs, analytics/scorecard weights — all DB-driven |
| Monitor **platform health** | DAU, revenue, concurrent viewers |

### 1.2 V1 vs later

| V1 (launch-blocking) | V1.5 (soon after launch) | V2 (stakeholder / growth) |
|----------------------|--------------------------|---------------------------|
| Dashboard overview (real metrics) | Content browse (videos/podcasts/verticals) | Advertiser self-serve portal |
| Reports queue + actions | Fraud signals queue | Programs hub admin |
| Streamer applications | Tax document review | GAF program editor |
| User search, ban, verify | Coin packages & gift catalog | Sponsorship deal manager |
| Live streams + kill | Platform announcements (Insider) | Community impact reports |
| Payout queue | Transaction log viewer | Insider subscription admin |
| Ad campaigns CRUD | Partner tier assignment | Typesense reindex tools |
| Revenue split rules editor | | |
| **Platform config & scorecard** | Ad settings, coin/gift catalog, impact metric defaults | Mission KPI tuning without code |

### 1.3 Design principle: configurable operations

**Nothing mission-critical should require a code deploy.** Percentages, ad placement behavior, payout minimums, program/category labels, and Creator Impact Dashboard™ scorecard inputs must be readable/writable from `/admin` and stored in Postgres (existing tables where possible, `platform_settings` key-value JSON where not).

The runtime rule: **app code reads config at transaction time** — never hardcode stakeholder percentages, ad skip seconds, or impact display weights in NestJS or Next.js.

### 1.4 Success criteria

- [ ] Only `role: admin` can access `/admin/*` routes (frontend + API).
- [ ] An admin can clear a pending report end-to-end in under 60 seconds.
- [ ] An admin can approve a streamer with ID review in under 2 minutes.
- [ ] An admin can kill a live stream and the public `/live/[id]` page reflects `ended` within 10 seconds.
- [ ] All destructive actions require confirmation + optional reason note.
- [ ] No admin secrets in client bundle; all writes go through NestJS `/admin/*`.

---

## 2. Architecture

### 2.1 Placement in the monorepo

**Recommendation:** Admin UI as a **route group inside the existing Next.js app**, not a separate deployable (simpler auth, shared components, one Vercel project).

```
app/
  admin/
    layout.tsx          # Admin shell: sidebar, auth gate, no consumer header/footer
    page.tsx            # Dashboard overview
    moderation/
    users/
    streamers/
    live/
    payouts/
    ads/
    revenue/
    analytics/
    settings/
```

Alternative (Phase 2): `admin.prysym.tv` subdomain pointing at same app with middleware path rewrite.

### 2.2 Authentication & authorization

| Layer | Behavior |
|-------|----------|
| **API** | Every `/admin/*` route uses `JwtAuthGuard` + `RolesGuard` + `@Roles(UserRole.admin)` (already on `AdminController`) |
| **Frontend gate** | `app/admin/layout.tsx` waits for `authLoading`, reads `user.role` from `GET /users/me` (`MeResponse.role`) |
| **Non-admin** | Redirect to `/` with toast: "Admin access required" |
| **Unauthenticated** | Show `AuthModal` or redirect to `/` with login prompt |
| **Token** | Same Bearer token as consumer app (`lib/api-client.ts`) |

**Frontend gap to fix:** `contexts/auth-context.tsx` / `mapMeToUser` do not expose `role` today. Add `role` to `User` type and surface it for the admin gate.

### 2.3 API client

New module: `lib/api/admin.ts` — typed wrappers for all admin endpoints. Never call admin routes from consumer pages.

```ts
// Pattern
export function fetchAdminReports(params: { status?: string; page?: number }) {
  return apiRequest<AdminReportsResponse>("/admin/reports", { query: params });
}
```

### 2.4 Layout shell

**Left sidebar (persistent):**

- Logo + "Prysym Admin"
- Nav sections (see §4)
- Footer: logged-in admin `@username`, link to consumer site, logout

**Top bar:**

- Page title + breadcrumb
- Global search (users by email/username — V1.5)
- Notification bell: counts for pending reports, pending streamers, pending payouts (poll every 60s or SSE later)

**Content area:**

- Max width ~1400px for tables; full width for analytics charts
- Dark theme aligned with consumer app (`globals.css` tokens) but **denser** (operator UI): smaller padding, data tables, monospace IDs

### 2.5 Responsive behavior

- Desktop-first (1280px+ ideal)
- Tablet: collapsible sidebar
- Mobile: read-only alerts OK; moderation actions discouraged but not blocked

---

## 3. API inventory (current vs required)

### 3.1 Implemented today (`api/src/admin/admin.controller.ts`)

| Method | Route | Status | Notes |
|--------|-------|--------|-------|
| GET | `/admin/analytics/overview` | 🚧 Stub | Returns `{ message, dau: 0, revenueToday: 0 }` |
| GET | `/admin/revenue-split-rules` | ✅ | Lists all rules |
| PUT | `/admin/revenue-split-rules/:ruleKey` | ✅ | Bps must sum to 10_000 |
| GET | `/admin/ads/campaigns` | ✅ | Full list |
| POST | `/admin/ads/campaigns` | ✅ | `CreateAdCampaignDto` |
| PUT | `/admin/ads/campaigns/:id/status` | ✅ | `{ status }` only — no full edit |

### 3.2 Documented in plan / `api.md` but **not implemented**

| Method | Route | Priority | Used by |
|--------|-------|----------|---------|
| GET | `/admin/users` | P0 | Users list |
| GET | `/admin/users/:id` | P0 | User detail |
| PUT | `/admin/users/:id/ban` | P0 | `{ banned: boolean, reason? }` |
| PUT | `/admin/users/:id/verify` | P0 | `{ verified: boolean }` |
| PUT | `/admin/users/:id/role` | P1 | Promote creator/admin (careful) |
| PUT | `/admin/users/:id/partner-tier` | P1 | `CreatorPartnerTier` |
| PUT | `/admin/users/:id/streamer-status` | P0 | Approve/reject + sync `streamer_applications` |
| GET | `/admin/reports` | P0 | Moderation queue |
| GET | `/admin/reports/:id` | P0 | Report detail with resolved target |
| PUT | `/admin/reports/:id` | P0 | `{ action: dismiss \| delete_content \| ban_user, notes? }` |
| DELETE | `/admin/videos/:id` | P0 | Force delete + storage cleanup job |
| DELETE | `/admin/podcast-episodes/:id` | P1 | Same pattern |
| DELETE | `/admin/vertical-episodes/:id` | P1 | Same pattern |
| DELETE | `/admin/comments/:id` | P0 | Comment moderation |
| GET | `/admin/streams/live` | P0 | Could alias `GET /streams/live` + admin fields |
| POST | `/admin/streams/:id/kill` | P0 | MediaMTX disconnect + DB `ended` |
| GET | `/admin/streamer-applications` | P0 | Filter `status=pending` |
| GET | `/admin/streamer-applications/:id` | P0 | With signed ID doc URL |
| PUT | `/admin/streamer-applications/:id` | P0 | `{ status, reviewNotes? }` |
| GET | `/admin/payouts` | P0 | `status=requested` default |
| PUT | `/admin/payouts/:id` | P0 | `{ status: processing \| completed \| rejected, notes? }` |
| GET | `/admin/payouts/:id` | P1 | Detail + creator balance context |
| PUT | `/admin/ads/campaigns/:id` | P1 | Full edit (not just status) |
| GET | `/admin/analytics/overview` | P0 | **Replace stub** with real aggregates |
| GET | `/admin/analytics/revenue` | P1 | Time series |
| GET | `/admin/analytics/content` | P1 | Top videos/streams |
| GET | `/admin/fraud-signals` | V2 | `fraud_signals` table exists |
| PUT | `/admin/fraud-signals/:id` | V2 | |
| GET | `/admin/transactions` | V1.5 | `transactions` table |
| GET/PUT | `/admin/coin-packages` | V1.5 | `coin_packages` seeded |
| GET/PUT | `/admin/gift-catalog` | V1.5 | `gift_catalog` seeded |

### 3.3 Supporting data already in DB (no admin API yet)

| Table | Admin use |
|-------|-----------|
| `reports` | Moderation queue |
| `streamer_applications` | ID + description review |
| `users` | Ban, verify, role, `streamer_status`, `partner_tier` |
| `videos`, `podcast_episodes`, `vertical_episodes`, `comments` | Content takedown |
| `streams` | Live ops |
| `creator_payouts`, `creator_balance_ledger` | Payouts |
| `ad_campaigns`, `content_ad_events` | Ads performance |
| `revenue_split_rules`, `revenue_ledger_*` | Economy |
| `fraud_signals` | Trust & safety (V2) |
| `platform_insider_subscriptions` | Insider admin (V2) |
| `gaf_programs`, `gaf_ledger_entries` | GAF (V2) |
| `platform_announcements` | Insider comms (V1.5) |

---

## 4. Navigation map

```
/admin                          → Dashboard (Overview)
/admin/moderation               → Reports queue (default tab: Pending)
/admin/moderation/history       → Resolved reports

/admin/users                    → User directory
/admin/users/[id]               → User detail

/admin/streamers                → Applications queue (default: Pending)
/admin/streamers/[id]           → Application detail

/admin/live                     → Live now
/admin/live/history             → Recent streams (ended)

/admin/payouts                  → Payout requests (default: Requested)
/admin/payouts/history          → Completed / rejected

/admin/ads                      → Campaign list
/admin/ads/new                  → Create campaign
/admin/ads/[id]                 → Campaign detail + edit

/admin/revenue                  → Revenue split rules (default tab)
/admin/revenue/ledger           → Ledger batches (V1.5, read-only)

/admin/config                   → Platform configuration hub (see §12)
/admin/config/revenue           → Split rules (alias or tab)
/admin/config/ads               → Ad network settings + placements
/admin/config/economy           → Coins, gifts, payout mins, product prices
/admin/config/scorecard         → Impact dashboard & mission KPI config
/admin/config/programs          → Program/category labels & discovery order

/admin/analytics                → Platform charts (V1.5 expand)

/admin/settings                 → Admin preferences & system (V1.5)
```

**Sidebar grouping:**

| Group | Items |
|-------|-------|
| **Operations** | Dashboard, Moderation, Live |
| **People** | Users, Streamers |
| **Money** | Payouts, Revenue, Ads |
| **Insights** | Analytics |
| **Platform** | Revenue, Ads, **Configuration** (splits, ads, economy, scorecard) |
| **System** | Settings |

**Badge counts on nav items:**

- Moderation → `reports WHERE status = pending` count
- Streamers → `streamer_applications WHERE status = pending` count
- Payouts → `creator_payouts WHERE status = requested` count
- Live → `streams WHERE status = live` count (informational, not alert)

---

## 5. Global UI patterns

### 5.1 Tables

- Server-side pagination: `?page=1&limit=25` (max 100)
- Sort: `?sort=createdAt&order=desc`
- Sticky header, row click → detail drawer or `/admin/.../[id]`
- Columns: primary label, status pill, relative time (`2h ago`), actions menu (⋯)

### 5.2 Status pills

| Domain | Values | Colors |
|--------|--------|--------|
| Report | `pending`, `reviewed`, `actioned`, `dismissed` | amber, blue, red, gray |
| Streamer app | `pending`, `approved`, `rejected` | amber, green, red |
| Stream | `scheduled`, `live`, `ended` | gray, green, slate |
| Payout | `requested`, `processing`, `completed`, `rejected` | amber, blue, green, red |
| Ad campaign | `draft`, `active`, `paused`, `completed` | gray, green, amber, slate |
| User | `active`, `banned` | green, red |

### 5.3 Action confirmations

Destructive actions use a modal:

- Title: "Ban user @jane?"
- Body: consequence summary (revokes sessions, ends streams, hides content)
- Required: **Reason** textarea (stored in audit log / `reviewNotes` where applicable)
- Buttons: Cancel | Confirm (red)

### 5.4 Detail drawer vs full page

| Use drawer | Use full page |
|------------|---------------|
| Quick report preview | User detail (many tabs) |
| Campaign status change | Streamer application (ID image) |
| Dismiss report | Ad campaign create/edit form |

### 5.5 Target resolution (reports)

Reports store `targetType` + `targetId` only. Admin API **must hydrate** for UI:

| `targetType` | Resolve to | Preview fields |
|--------------|------------|----------------|
| `video` | `videos` | title, thumbnail, type, creator, `hlsMasterUrl` |
| `comment` | `comments` + video | body, author, parent video title |
| `stream` | `streams` | title, status, creator, viewer count |
| `user` | `users` | username, avatar, bio |
| `podcast_episode` | `podcast_episodes` + show | title, show title, cover |
| `vertical_episode` | `vertical_episodes` + series | title, series slug, thumbnail |

Link out to consumer URL in new tab for context (e.g. `/watch/[id]`, `/podcast/[id]`).

### 5.6 Empty states

- Pending queue empty → "All caught up" with checkmark illustration
- API error → retry button + support contact
- 403 → "Admin access required"

---

## 6. Page specifications

### 6.1 Dashboard — `/admin`

**Purpose:** At-a-glance platform health + queue depths.

#### Sections

**A. KPI cards (row of 5)**

| Card | Metric | Source |
|------|--------|--------|
| DAU | Unique users with analytics event today | `analytics_events` or Redis |
| Live now | Count + total viewers | `streams WHERE status=live` |
| Revenue today | USD gross (coins + premium + gifts) | `revenue_ledger_batches` / `transactions` |
| Pending reports | Count | `reports WHERE status=pending` |
| Pending payouts | Count + sum USD | `creator_payouts WHERE status=requested` |

Clicking a card deep-links to the relevant queue.

**B. Live streams snapshot**

- Mini table: thumbnail, title, creator, viewers, started at
- Row action: "Open" → `/admin/live`, "Kill" → confirm modal

**C. Recent reports (last 5 pending)**

- Quick action buttons: Dismiss | Review

**D. Activity feed (V1.5)**

- Chronological: new signups, new streamer apps, completed payouts

#### Filters / tabs

- Time range selector for revenue chart: Today | 7d | 30d (V1.5)

#### Checklist

- [ ] API: real `GET /admin/analytics/overview` implementation
- [ ] Frontend: KPI cards with loading skeletons
- [ ] Frontend: deep links to queues
- [ ] Frontend: auto-refresh every 60s (toggle off)

---

### 6.2 Moderation — `/admin/moderation`

**Purpose:** Process user-submitted reports.

#### Tabs

| Tab | Filter | Default |
|-----|--------|---------|
| Pending | `status=pending` | ✅ |
| In review | `status=reviewed` | |
| Actioned | `status=actioned` | |
| Dismissed | `status=dismissed` | |
| All | no filter | |

#### Filters (toolbar)

- **Target type:** All | Video | Comment | Stream | User | Podcast episode | Vertical episode
- **Reason:** All | spam | nudity | violence | harassment | other
- **Date range:** createdAt from/to
- **Search:** reporter username or target ID

#### Table columns

| Column | Description |
|--------|-------------|
| Report ID | Truncated UUID, copy button |
| Target | Type icon + resolved title + thumbnail |
| Reason | Enum label |
| Reporter | @username link → user detail |
| Submitted | Relative + absolute timestamp |
| Status | Pill |
| Actions | Review (primary) |

#### Report detail (drawer or `/admin/moderation/[id]`)

**Left column — Report metadata**

- ID, status, created at
- Reporter (link)
- Reason + free-text description
- Reviewed by / at (if any)

**Center — Target preview**

- Embedded preview by type (video player for video, text for comment, etc.)
- "View on site" external link

**Right column — Actions**

| Action | API | Side effects |
|--------|-----|--------------|
| **Dismiss** | `PUT /admin/reports/:id` `{ action: "dismiss" }` | `status=dismissed`, no content change |
| **Delete content** | `{ action: "delete_content" }` | Deletes/hides target; `status=actioned` |
| **Ban user** | `{ action: "ban_user" }` | Sets `users.is_banned=true`, ends streams; optional delete content |
| **Ban + delete** | Combined | Both |

Optional: **Assign to me** (V1.5) — `reviewedById` without final action.

**Bulk actions (V1.5):** select multiple → dismiss all.

#### Checklist

- [ ] API: `GET /admin/reports` with filters + pagination
- [ ] API: `GET /admin/reports/:id` with hydrated target
- [ ] API: `PUT /admin/reports/:id` with action enum
- [ ] API: delete helpers per target type
- [ ] API: ban user revokes `refresh_sessions`, sets `is_banned`
- [ ] Frontend: tabs, filters, table
- [ ] Frontend: detail drawer + action modals
- [ ] Frontend: target preview components (6 types)
- [ ] Email notify reporter on action (V1.5)

---

### 6.3 Users — `/admin/users`

**Purpose:** Find and manage accounts.

#### List — `/admin/users`

**Filters:**

- Search: username, email, display name (ILIKE)
- Role: all | user | creator | admin
- Status: all | active | banned
- Verified: all | yes | no
- Streamer status: all | none | pending | approved | rejected
- Partner tier: all | standard | rising | partner | flagship
- Premium: all | none | basic | premium | ultimate
- Joined date range

**Table columns:**

| Column | Notes |
|--------|-------|
| User | Avatar + display name + @username |
| Email | Masked option V1.5 (`j***@gmail.com`) |
| Role | Badge |
| Status | Active / Banned |
| Verified | ✓ or — |
| Streamer | Status pill |
| Coins | Balance |
| Joined | Date |

**Row actions (⋯ menu):**

- View detail
- Ban / Unban
- Verify / Remove verification
- View reports filed against (V1.5)

#### Detail — `/admin/users/[id]`

**Header:** avatar, name, @username, badges (verified, banned, premium, partner tier)

**Tabs:**

| Tab | Content |
|-----|---------|
| **Overview** | Email, role, createdAt, coins, premium expiry, OAuth linked (google/apple ids present yes/no) |
| **Streamer** | `streamer_status`, link to application if exists |
| **Content** | Counts: videos, podcasts, vertical series, streams; links to content admin V1.5 |
| **Financial** | Creator balance ledger summary, payout history |
| **Reports** | Reports where user is reporter or target |
| **Actions** | Danger zone |

**Overview actions:**

| Action | API | Notes |
|--------|-----|-------|
| Verify | `PUT /admin/users/:id/verify` | `is_verified=true` |
| Remove verify | same | `false` |
| Ban | `PUT /admin/users/:id/ban` | `is_banned=true`, revoke sessions |
| Unban | same | `false` |
| Change role | `PUT .../role` | **Super-admin only** — prevent self-demotion |
| Set partner tier | `PUT .../partner-tier` | `CreatorPartnerTier` |
| Force password reset email | `POST /admin/users/:id/reset-password` | V1.5 — triggers existing forgot-password flow |
| Adjust coins | `PUT .../coins` | V1.5 — audit logged; support refunds |

**Danger zone:**

- Ban permanently (requires reason)
- Delete account (V2 — soft delete only)

#### Checklist

- [ ] API: `GET /admin/users` paginated + filters
- [ ] API: `GET /admin/users/:id` with aggregates
- [ ] API: ban, verify, role, partner-tier endpoints
- [ ] Frontend: list + filters
- [ ] Frontend: detail page with tabs
- [ ] Frontend: expose `role` in auth context for gate

---

### 6.4 Streamers — `/admin/streamers`

**Purpose:** Review Go Live applications (`streamer_applications` + ID upload).

#### Queue — `/admin/streamers`

**Default filter:** `status=pending`

**Tabs:** Pending | Approved | Rejected | All

**Table columns:**

| Column | Notes |
|--------|-------|
| Applicant | Avatar + @username |
| Submitted | `createdAt` |
| Description | Truncated 80 chars |
| ID document | "View" button → signed URL |
| Status | Pill |
| Reviewer | Admin username if reviewed |

#### Detail — `/admin/streamers/[id]`

**Sections:**

1. **Applicant profile** — link to user detail, account age, prior reports count
2. **Application text** — full `description`
3. **ID document** — full-width image viewer (`id_document_url` via signed/local URL); zoom + download (audit logged)
4. **Review form**
   - Approve | Reject
   - Review notes (internal, optional; stored in `review_notes`)
   - On approve: set `users.streamer_status=approved`, `streamer_applications.status=approved`, `reviewed_by`
   - On reject: set `rejected`, allow re-apply policy (user can submit again — existing `POST /users/apply-streamer` upserts)

**Side effects on approve:**

- Optional system notification to user (`notifications` type `system`)
- Optional email (Resend) — "You're approved to go live"

**Dev note:** `AUTO_APPROVE_STREAMER=true` bypasses queue in dev; admin UI should still list auto-approved for audit.

#### Checklist

- [ ] API: `GET /admin/streamer-applications`
- [ ] API: `GET /admin/streamer-applications/:id` with signed `idDocumentUrl`
- [ ] API: `PUT /admin/streamer-applications/:id`
- [ ] API: sync `users.streamer_status` (or use existing `PUT .../streamer-status`)
- [ ] Frontend: queue table + ID viewer
- [ ] Frontend: approve/reject with notes
- [ ] Optional: email on decision

---

### 6.5 Live operations — `/admin/live`

**Purpose:** Monitor and intervene in live streams.

#### Tab: Live now — `/admin/live`

**Auto-refresh:** every 10s

**Table columns:**

| Column | Notes |
|--------|-------|
| Stream | Title + category |
| Creator | @username |
| Viewers | `viewer_count` |
| Started | `startedAt` |
| Vertical | `vertical` if set |
| Linked event | Live event title if `live_events.stream_id` |

**Row actions:**

| Action | Behavior |
|--------|----------|
| Watch | Open `/live/[id]` in new tab |
| User | → `/admin/users/[creatorId]` |
| Kill stream | Confirm → `POST /admin/streams/:id/kill` |

**Kill stream implementation notes:**

1. Call MediaMTX API to disconnect publisher (path: `live/{streamKey}` — confirm key mapping in `streams.service.ts`)
2. Update `streams.status = ended`, `endedAt = now()`
3. Emit Socket.IO room close event (V1.5)
4. Optional: temp ban streamer (checkbox in kill modal)
5. Log admin user ID + reason

#### Tab: History — `/admin/live/history`

- Filter: ended streams, last 7d default
- Columns: title, creator, duration, peak viewers (V1.5), ended at
- Action: view VOD if recorded (future)

#### Checklist

- [ ] API: `POST /admin/streams/:id/kill` + MediaMTX integration
- [ ] API: admin-enriched live list (reports count per stream V1.5)
- [ ] Frontend: live table with auto-refresh
- [ ] Frontend: kill confirmation modal with reason

---

### 6.6 Payouts — `/admin/payouts`

**Purpose:** Approve creator withdrawal requests (`creator_payouts`).

**Business rules (from `CreatorsBalanceService`):**

- Minimum request: **$50**
- Request creates ledger **debit** immediately (balance reserved)
- Status flow: `requested` → `processing` → `completed` OR `rejected`
- On reject: reverse ledger debit (credit back)

#### Tabs

| Tab | Filter |
|-----|--------|
| Requested | `status=requested` (default) |
| Processing | `status=processing` |
| Completed | `status=completed` |
| Rejected | `status=rejected` |

#### Table columns

| Column | Notes |
|--------|-------|
| Payout ID | UUID |
| Creator | @username |
| Amount | USD |
| Method | paypal \| bank_transfer \| crypto |
| Requested | `createdAt` |
| Status | Pill |
| Processed by | Admin if set |

#### Detail drawer

- Creator available balance at request time (V1.5 snapshot)
- Lifetime credits
- Tax profile status (`creator_tax_profiles.document_status`) — warn if `not_submitted`
- Payout method (no bank details in V1 — creator entered off-platform)

**Actions:**

| Action | API | Notes |
|--------|-----|-------|
| Mark processing | `PUT /admin/payouts/:id` | Ops started |
| Complete | `{ status: "completed" }` | Manual PayPal/bank sent |
| Reject | `{ status: "rejected", notes }` | Refund balance |

**V2:** Stripe Connect automated payouts.

#### Checklist

- [ ] API: `GET /admin/payouts` + filters
- [ ] API: `PUT /admin/payouts/:id` with status transitions + ledger reversal on reject
- [ ] Frontend: tabs + table
- [ ] Frontend: detail + action modals
- [ ] Show tax profile warning badge

---

### 6.7 Advertising — `/admin/ads`

**Purpose:** Manage private ad campaigns (`ad_campaigns`).

#### Campaign list — `/admin/ads`

**Filters:** status, placement, date range, advertiser name search

**Table columns:**

| Column | Notes |
|--------|-------|
| Campaign | Title |
| Advertiser | `advertiserName` |
| Placement | `home_banner` \| `shorts_interstitial` \| `movie_preroll` \| `vertical_episode` |
| Budget | USD |
| Delivery | `deliveredImpressions` / `targetImpressions` progress bar |
| CTR | clicks / impressions |
| Status | Pill |
| Schedule | startsAt – endsAt |

**Row actions:** View, Pause/Resume, Duplicate (V1.5)

#### Create — `/admin/ads/new`

**Form fields (maps to `CreateAdCampaignDto`):**

| Field | Type | Validation |
|-------|------|------------|
| Advertiser name | text | required |
| Campaign title | text | required |
| Media URL | url | image or video; V1.5: upload to R2 |
| Click-through URL | url | required |
| Placement | select | `AdPlacement` enum |
| Target impressions | integer | min 1 |
| Budget USD | decimal | min 0 |
| Start date | datetime | |
| End date | datetime | after start |
| Initial status | select | draft \| active |

**On submit:** `POST /admin/ads/campaigns`

#### Detail — `/admin/ads/[id]`

**Tabs:**

| Tab | Content |
|-----|---------|
| **Overview** | All fields + status toggle |
| **Performance** | Impressions, clicks, CTR chart over time (`content_ad_events`) |
| **Creators** | Top creators by ad events on their videos (V1.5) |

**Status actions:** `PUT /admin/ads/campaigns/:id/status` — active, paused, completed

**V1.5:** `PUT /admin/ads/campaigns/:id` full edit

#### Placements reference (for admins)

| Placement | Consumer surface |
|-----------|------------------|
| `home_banner` | Home page above Live Now |
| `shorts_interstitial` | Shorts feed every N swipes |
| `movie_preroll` | `/movie/[id]` before playback |
| `vertical_episode` | Vertical watch between episodes |

#### Tab: Network settings — `/admin/config/ads` or `/admin/ads/settings`

Global ad behavior (today partially hardcoded in `AdsService` — **move to DB**):

| Setting | Default (dev) | Consumer effect |
|---------|---------------|-----------------|
| `shorts_interstitial_every_n` | 5–10 swipes | Shorts ad frequency |
| `movie_preroll_skip_seconds` | 15 | Preroll skip timer |
| `shorts_skip_after_seconds` | 5 | Interstitial skip |
| `vertical_episode_ad_enabled` | true | Between-episode ads |
| `premium_ad_free` | true | Premium users skip ads |
| `gaf_allocation_rule_key` | `ad_gaf_allocation` | Which split rule runs on ad revenue |
| `impression_revenue_cpm_usd` | optional | CPM model for ledger (V1.5) |

**Placements toggles:** enable/disable each `AdPlacement` without deleting campaigns.

#### Checklist

- [ ] Frontend: campaign list (API exists)
- [ ] Frontend: create form
- [ ] Frontend: detail + pause/resume
- [ ] API: campaign update (full) — V1.5
- [ ] API: performance aggregates — V1.5
- [ ] Media upload helper — V1.5
- [ ] API: `GET/PUT /admin/config/ads` — network settings table or `platform_settings`
- [ ] Refactor `AdsService` to read skip/frequency from config

---

### 6.8 Revenue & economy — `/admin/revenue`

**Purpose:** Edit stakeholder split rules without code changes.

#### Tab: Split rules — `/admin/revenue` (default)

**Table:** one row per `revenue_split_rules.ruleKey`

| Column | Notes |
|--------|-------|
| Rule key | e.g. `viewer_support` |
| Name | Human name |
| Creator % | `creatorBps / 100` |
| Platform % | `platformBps / 100` |
| GAF % | `gafBps / 100` |
| Creator dev fund % | `creatorDevFundBps / 100` |
| Updated | `updatedAt` + by admin |

**Seeded keys:** `live_event`, `viewer_support`, `insider_membership`, `ad_gaf_allocation`, `sponsorship`, `creator_subscription`, `coin_purchase`, `store_merchandise`

**Edit modal:**

- Sliders or bps inputs for each party
- Live validation: **must sum to 10000 bps (100%)**
- Description textarea
- Save → `PUT /admin/revenue-split-rules/:ruleKey`

**Warning banner:** "Changes apply to new transactions only; past ledger batches are immutable."

#### Tab: Ledger — `/admin/revenue/ledger` (V1.5)

- Read-only paginated `revenue_ledger_batches`
- Filters: ruleKey, sourceType, date, creatorId
- Expand row → `revenue_ledger_entries` party breakdown

#### Tab: GAF programs (V2)

- CRUD `gaf_programs`
- View `gaf_ledger_entries` inflow/outflow

#### Checklist

- [ ] Frontend: rules table (API exists)
- [ ] Frontend: edit modal with bps validation
- [ ] Frontend: ledger browser — V1.5

---

### 6.9 Analytics — `/admin/analytics` (V1.5 expand)

**Purpose:** Deeper charts than dashboard.

**Sections:**

| Chart | Data |
|-------|------|
| DAU / WAU / MAU | `analytics_events` |
| New signups | `users.createdAt` |
| Revenue by source | `revenue_ledger_batches` grouped by `sourceType` |
| Top content | videos by `viewsCount` |
| Live hours | sum stream durations |
| Premium subscribers | count by `premium_tier` |
| Insider members | `platform_insider_subscriptions` (V2) |

**Filters:** 7d | 30d | 90d | custom range

#### Checklist

- [ ] API: `GET /admin/analytics/revenue` time series
- [ ] API: `GET /admin/analytics/content`
- [ ] Frontend: chart components (recharts or similar)
- [ ] CSV export — V1.5

---

### 6.10 Settings — `/admin/settings` (V1.5)

| Section | Options |
|---------|---------|
| **My account** | Admin profile, change password |
| **Team** | List users with `role=admin`; promote/demote (super-admin) |
| **Feature flags** | `AUTO_APPROVE_STREAMER`, maintenance mode (V2) |
| **System health** | Link to `GET /health`, MediaMTX status, Redis ping |
| **Audit log** | Read-only table of admin actions (V2 — new `admin_audit_log` table) |

#### Checklist

- [ ] Frontend: settings shell
- [ ] API: admin audit log — V2
- [ ] Health status widgets

---

### 6.11 Future pages (V2 — document only)

| Page | Purpose |
|------|---------|
| `/admin/content/*` | Browse/delete videos, podcasts, verticals without a report |
| `/admin/fraud` | `fraud_signals` queue |
| `/admin/insider` | Insider subs + `platform_announcements` |
| `/admin/programs` | `creator_program_verticals`, live events |
| `/admin/sponsorships` | `sponsorship_deals` |
| `/admin/advertisers` | `advertiser_accounts` + impact reports |
| `/admin/store` | Creator store orders moderation |

---

## 7. Core workflows

### 7.1 Report → dismiss

```
User files POST /reports
  → reports.status = pending
Admin opens /admin/moderation
  → GET /admin/reports?status=pending
Admin clicks Dismiss
  → PUT /admin/reports/:id { action: "dismiss", notes? }
  → status = dismissed, reviewedById set
```

### 7.2 Report → delete content

```
Admin reviews target preview
  → PUT { action: "delete_content" }
Backend:
  → Delete/hide by targetType (video: delete row + queue storage cleanup)
  → reports.status = actioned
  → Optional: notify content owner
```

### 7.3 Report → ban user

```
Admin confirms ban
  → PUT { action: "ban_user", notes }
Backend:
  → users.is_banned = true
  → Revoke all refresh_sessions
  → Kill active streams
  → reports.status = actioned
```

### 7.4 Streamer approve

```
Creator POST /users/apply-streamer + ID upload
  → streamer_applications.status = pending
  → users.streamer_status = pending
Admin opens /admin/streamers/[id]
  → Views ID image
  → Approve
Backend:
  → application.status = approved, reviewed_by, review_notes
  → users.streamer_status = approved
  → Notification + email (optional)
```

### 7.5 Kill live stream

```
Admin /admin/live → Kill
  → POST /admin/streams/:id/kill { reason }
Backend:
  → MediaMTX disconnect
  → streams.status = ended, endedAt = now()
  → (V1.5) Socket.IO broadcast stream_ended
```

### 7.6 Payout complete

```
Creator POST /creators/payouts/request
  → creator_payouts.status = requested
  → ledger debit
Admin marks completed after manual transfer
  → PUT /admin/payouts/:id { status: "completed" }
  → processed_by = admin id
```

### 7.7 Payout reject (refund balance)

```
Admin rejects with reason
  → PUT { status: "rejected", notes }
Backend:
  → creator_payouts.status = rejected
  → creator_balance_ledger credit (reverse debit)
  → Notify creator
```

---

## 8. Security, permissions & audit

### 8.1 Roles

| Role | Access |
|------|--------|
| `user` | No admin |
| `creator` | No admin |
| `admin` | Full admin UI (V1 — single tier) |

**V2:** split `admin` vs `super_admin` for role promotion and revenue rule edits.

### 8.2 Rules

- Never trust client-side role checks alone — API enforces `RolesGuard`
- Admin cannot ban themselves (API guard)
- ID documents: short-lived signed URLs; access logged
- Rate limit admin routes (e.g. 300 req/min per admin)
- CSRF: use Bearer header (not cookie) for admin mutations on web

### 8.3 Audit trail (V2 table proposal)

`admin_audit_log`: `id`, `admin_user_id`, `action`, `target_type`, `target_id`, `metadata` JSON, `ip`, `created_at`

Log: ban, verify, report action, stream kill, payout decision, revenue rule change.

### 8.4 Seeding first admin

```sql
UPDATE users SET role = 'admin' WHERE email = 'ops@yourdomain.com';
```

Add to `api/prisma/seed.ts` for dev only (document in README).

---

## 9. Implementation phases & master checklist

### Phase 0 — Foundation

- [ ] Add `role` to frontend `User` + `mapMeToUser`
- [ ] Create `app/admin/layout.tsx` with sidebar + auth gate
- [ ] Create `lib/api/admin.ts` skeleton
- [ ] Add admin nav badge count endpoint or include in overview
- [ ] Seed dev admin user documented in `api/README.md`

### Phase 1 — Backend admin APIs (P0)

- [ ] `GET /admin/reports` + `GET /admin/reports/:id` + `PUT /admin/reports/:id`
- [ ] `GET /admin/users` + `GET /admin/users/:id`
- [ ] `PUT /admin/users/:id/ban` + `verify`
- [ ] `GET /admin/streamer-applications` + `GET/:id` + `PUT/:id`
- [ ] `GET /admin/payouts` + `PUT /admin/payouts/:id` (with reject refund)
- [ ] `POST /admin/streams/:id/kill`
- [ ] `DELETE /admin/videos/:id` + `DELETE /admin/comments/:id`
- [ ] Replace `GET /admin/analytics/overview` stub with real data
- [ ] Update `../api/api.md` with all new routes

### Phase 2 — Frontend core pages (P0)

- [ ] `/admin` dashboard
- [ ] `/admin/moderation` full queue + detail + actions
- [ ] `/admin/users` list + `/admin/users/[id]` detail
- [ ] `/admin/streamers` queue + detail + ID viewer
- [ ] `/admin/live` live table + kill
- [ ] `/admin/payouts` queue + actions

### Phase 3 — Ads, revenue & platform config (P0 partial)

- [ ] `/admin/ads` list + create + detail (wire existing APIs)
- [ ] `/admin/revenue` split rules editor (wire existing APIs)
- [ ] `/admin/config` hub shell + tabs (revenue, ads, economy, scorecard, programs)
- [ ] `GET/PUT /admin/config/*` APIs + `platform_settings` migration if needed
- [ ] Refactor hardcoded ad/economy constants to read admin config

### Phase 4 — Polish (P1)

- [ ] `/admin/analytics` charts
- [ ] `/admin/live/history`
- [ ] `/admin/moderation/history`
- [ ] `/admin/payouts/history`
- [ ] User detail financial + reports tabs
- [ ] Ad campaign performance tab
- [ ] Revenue ledger read-only
- [ ] `/admin/settings` health + team

### Phase 5 — V2 backlog

- [ ] Fraud signals
- [ ] Insider + announcements
- [ ] Content browser without report
- [ ] Advertiser accounts
- [ ] Admin audit log table + UI
- [ ] Super-admin role split

---

## 10. Frontend file structure

```
app/admin/
  layout.tsx
  page.tsx
  moderation/
    page.tsx
    [id]/page.tsx          # optional; drawer preferred
  users/
    page.tsx
    [id]/page.tsx
  streamers/
    page.tsx
    [id]/page.tsx
  live/
    page.tsx
  payouts/
    page.tsx
  ads/
    page.tsx
    new/page.tsx
    [id]/page.tsx
  revenue/
    page.tsx
  analytics/
    page.tsx
  settings/
    page.tsx

components/admin/
  admin-sidebar.tsx
  admin-topbar.tsx
  admin-table.tsx
  admin-status-pill.tsx
  admin-confirm-modal.tsx
  report-target-preview.tsx
  streamer-id-viewer.tsx
  revenue-split-editor.tsx
  kpi-card.tsx

lib/api/
  admin.ts
  admin-types.ts
```

---

## 11. QA & launch checklist

### Functional

- [ ] Non-admin user cannot access `/admin` (redirect + API 403)
- [ ] Admin can list and dismiss a report
- [ ] Admin can delete reported video; video no longer in feed
- [ ] Admin can ban user; banned user cannot login / refresh token
- [ ] Admin can approve streamer; user can `POST /streams/init`
- [ ] Admin can kill stream; stream leaves live directory
- [ ] Admin can complete and reject payout; reject restores balance
- [ ] Admin can create ad campaign; ad serves on correct placement
- [ ] Admin can edit revenue split; new gift uses updated rule
- [ ] Dashboard KPIs match DB queries (not hardcoded zeros)

### Security

- [ ] All `/admin/*` return 403 for non-admin JWT
- [ ] ID document URLs expire
- [ ] No admin routes in consumer bundles (tree-shake check)
- [ ] Destructive actions require confirmation

### UX

- [ ] Loading skeletons on all tables
- [ ] Empty states on zero pending queues
- [ ] Error toasts with API message
- [ ] Breadcrumbs correct on nested pages

### Docs

- [ ] `api.md` admin section complete
- [ ] [`backend-development-plan.md`](../api/backend-development-plan.md) §14.6 admin items checked off as done
- [ ] `api/README.md` — how to promote first admin user

---

---

## 12. Platform configuration hub (admin-editable, no deploys)

**Route:** `/admin/config` (sidebar: **Platform → Configuration**)

Single place for operators to change mission/economy/analytics behavior. Sub-tabs:

### 12.1 Revenue & splits — `/admin/config/revenue`

Same as §6.8 — canonical editor for `revenue_split_rules`:

| Config | Storage | Admin action |
|--------|---------|--------------|
| Live event 80/15/5 | `rule_key: live_event` | Edit bps |
| Viewer support 90/5/5 | `viewer_support` | Edit bps |
| Insider 80/10/10 | `insider_membership` | Edit bps (separate from Premium product — see stakeholder doc) |
| Ad → GAF allocation | `ad_gaf_allocation` | Edit bps |
| Sponsorship, store, coins, creator sub | respective keys | Edit bps |

- Preview: "If a $100 gift fires tomorrow, creator gets $X, GAF gets $Y"
- Audit: show `updatedBy` + timestamp on every rule

### 12.2 Ad network — `/admin/config/ads`

| Config | Storage | Notes |
|--------|---------|-------|
| Placement enable flags | `platform_settings` or `ad_placement_config` | Per `AdPlacement` enum |
| Skip / frequency knobs | `platform_settings` | See §6.7 network settings table |
| Default GAF rule for ad revenue | string `rule_key` | Links to split editor |
| Campaign defaults | optional | Default budget, duration templates |

Campaign CRUD stays under `/admin/ads`; **network behavior** lives here.

### 12.3 Economy — `/admin/config/economy`

| Config | Storage | Admin UI |
|--------|---------|----------|
| Coin packages | `coin_packages` | CRUD: coins, priceUsd, label, isActive, sortOrder |
| Gift catalog | `gift_catalog` | CRUD: name, coinCost, animationKey, isActive |
| Min payout USD | `platform_settings.min_payout_usd` | Number (today hardcoded $50 in API) |
| Premium tier prices | `platform_settings` or products table | Basic/Premium/Ultimate — **distinct from Insider $4.99** |
| Insider price | `platform_settings.insider_price_usd` | Default 4.99 |
| Coin USD rate | env fallback only in dev | Prod: read from config |

**APIs (proposed):**

- `GET /admin/config/economy`
- `PUT /admin/config/economy`
- `GET/PUT /admin/coin-packages`, `GET/PUT /admin/gift-catalog`

### 12.4 Analytics & dashboard KPIs — `/admin/config/analytics`

Controls what **admin overview** and **export reports** emphasize (not creator-facing).

| Config | Purpose |
|--------|---------|
| Default dashboard time range | 7d / 30d |
| KPI visibility toggles | Show/hide cards on `/admin` |
| Revenue chart grouping | By `sourceType` buckets |
| Alert thresholds | e.g. pending reports > 50 → badge red |

Read-only charts remain on `/admin/analytics`; **thresholds and defaults** live here.

### 12.5 Mission scorecard — `/admin/config/scorecard`

**Purpose:** Manage Creator Impact Dashboard™ and stakeholder **mission metrics** without engineering. Two layers:

#### A. Display weights & labels (creator dashboard UX)

Stored in `platform_settings.scorecard_display` (JSON):

- Section titles, help text, order of financial vs performance vs impact blocks
- Which revenue lines show when zero (hide vs show "—")
- Partner tier badge labels

#### B. Impact metric values & attribution rules

Stored in `creator_impact_snapshots` (per creator per month) — **admin can edit**:

| Field | Stakeholder metric | Admin capability |
|-------|-------------------|------------------|
| `jobsSupported` | Jobs supported | Manual override or bulk import |
| `businessesFunded` | Businesses funded | Manual / CSV |
| `dollarsInvested` | GAF dollars attributed | Manual / formula (V1.5) |
| `workforceOpportunities` | Workforce opportunities | Manual |
| `adRevenueUsd`, `sponsorshipRevenueUsd`, etc. | Financial breakdown | Recalc from ledger button (V1.5) |

**Admin UI:**

- **Global defaults** for new creators (starting zeros vs platform averages)
- **Per-creator editor** on `/admin/users/[id]` → tab **Impact scorecard**
- **Bulk recalculate** job: "Rebuild snapshots from ledger for month YYYY-MM" (V1.5)
- **Mission module scorecard** (14 modules): read-only status grid with manual "percent complete" notes for stakeholder reporting — optional `platform_settings.module_scorecard` JSON editable by admin

```
Module scorecard (admin-editable metadata, not code):
  Module 1 Creator Management    — 70%  [notes]
  Module 2 Revenue Engine        — 40%  [notes]
  ...
```

This is the **operational scorecard** you described: change values and narrative in admin, not in markdown files.

#### C. GAF program copy — `/admin/config/scorecard/gaf`

CRUD `gaf_programs` (economic, workforce, housing, youth): title, description, `isActive`. Public `/impact` page (future) reads this.

### 12.6 Program categories — `/admin/config/programs`

Admin-editable discovery metadata (maps to §13):

| Field | Maps to |
|-------|---------|
| `slug` | URL query `?program=sports` or category chip |
| `label` | "Sports", "Concerts", … |
| `vertical` | `ContentVertical` enum |
| `sort_order` | Chip order on `/videos` |
| `is_active` | Show/hide category |
| `icon` | optional emoji/url |

**API:** `GET/PUT /admin/config/programs` — backs `PLATFORM_PROGRAMS` constants today (move from code to DB).

### 12.7 Configuration checklist

- [ ] `platform_settings` table (key, value JSON, updated_by, updated_at) — if not using only existing tables
- [ ] `GET /admin/config` aggregated read
- [ ] `PUT /admin/config/:section` per-area writes with validation
- [ ] Frontend `/admin/config` tabbed hub
- [ ] Remove hardcoded ad skip/frequency from `AdsService`
- [ ] Remove hardcoded `MIN_PAYOUT_USD` from `CreatorsBalanceService` — read config
- [ ] Scorecard: per-creator impact editor on user detail
- [ ] Scorecard: module status grid for stakeholder reporting
- [ ] Programs config drives `/videos` category chips (consumer)

---

## 13. Content pillars as categories (consumer UX — no new silos)

**Decision (recommended):** Treat Sports, Concerts, Community Events, and Education as **categories on long-form video discovery**, not separate top-level product silos — **without breaking** existing nav (Home, Verticals, Movies, Shorts, Podcasts, Live).

### 13.1 Why this fits better than `/programs/sports` hubs

| Approach | Pros | Cons |
|----------|------|------|
| Separate pillar routes (`/sports`, `/concerts`) | Strong brand per vertical | Duplicates browse UX; fragments catalog; more nav clutter |
| **Categories on `/videos`** (YouTube-like) | One browse surface; uses existing `videos.vertical` + `category`; filters compose | Needs a solid `/videos` page (today underused) |

Stakeholder "pillars" become **discovery dimensions**, not new apps. Podcasts stay `/podcasts` (different content type). Verticals stay micro-drama. Movies stay `type=movie`. **Long-form `type=video`** gets the rich browse experience.

### 13.2 Consumer UX — `/videos` (evolve existing page)

**Layout:**

- Search bar + sort (trending, newest, most viewed)
- **Category chips:** All | General | Sports | Concerts | Community | Education | … (from admin `/admin/config/programs`, only `is_active`)
- **Filters (sidebar or sheet):**
  - Content type: Video (default) | optionally include live replays
  - **Live only:** streams with VOD or `live_events` linked to video — OR filter `GET /streams/live` entry point
  - Upload date range
  - Duration
- Grid of `VideoCard` → `/watch/[id]` (unchanged)

**API (extend existing feeds, no breaking changes):**

- `GET /feed/videos?vertical=sports&sort=views&page=1`
- `GET /feed/videos?liveOnly=true` — videos tied to ended/live streams or live event recordings (V1.5)
- Programs API (`GET /programs/:slug`) remains for **metadata**; consumer can redirect `/programs/sports` → `/videos?program=sports` (301 alias)

### 13.3 Data model (already compatible)

| Pillar | DB field |
|--------|----------|
| Sports | `videos.vertical = sports` or `category` |
| Concerts | `vertical = concert` |
| Community | `vertical = community_event` |
| Education | `vertical = education` |
| Podcasts | separate tables — **not** mixed into `/videos` |

Upload flow: creator picks **program/category** when publishing long-form video (dropdown from admin-configured programs).

### 13.4 What stays the same

- Side menu structure unchanged
- `/watch/[id]`, `/movie/[id]`, `/shorts`, `/podcasts`, `/verticals` unchanged
- `live_events` still power scheduled/live cards; surfaced via filters and home rows, not a mandatory new section
- Revenue splits unchanged — live events still use `live_event` rule when ticket/checkout exists (future)

### 13.5 Admin tie-in

- **Programs config** (§12.6) defines category chips and upload labels
- **No separate "Programs hub" admin** required for V1 — optional featured row on home driven by `?vertical=sports` feed

### 13.6 Checklist (consumer — post-admin or parallel)

- [ ] Redesign `/videos` with chips + filters + pagination
- [ ] `GET /feed/videos` query params: `vertical`, `category`, `sort`, `liveOnly`
- [ ] Upload UI: program/category select
- [ ] Redirect `/programs/:slug` → `/videos?program=:slug`
- [ ] Home optional row: "Sports" / "Concerts" using same feed API

---

*When a checkbox is completed in code, update this file and `api.md` in the same PR.*

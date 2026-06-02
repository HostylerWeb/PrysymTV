# Stakeholder Product Requirements (Onyx Repository Foundation)

**Source:** Product owner brief (PRYSYM TV™ — *Where Content Creates Community Wealth*).  
**Purpose:** Canonical list of mission-driven features, revenue rules, and implementation modules. Use this alongside `backend-development-plan.md` so nothing is dropped during build-out.

**Tag legend**

| Tag | Meaning |
|-----|---------|
| ✅ Partial | Some UI or API scaffolding exists |
| 🚧 Planned | Named in backend plan but not built |
| ❌ Gap | Not in plan or code — must be added |
| ⚠️ Conflict | Current plan differs from stakeholder rule — resolve before shipping |

---

## 0. Founder list vs “creator tiers” (important)

**Naming (important):**

| Term | Meaning |
|------|---------|
| **Verticals** (nav) | 9:16 **micro-drama / vertical film** series — episodic, ad before each next episode (`/verticals`, API `/verticals`) |
| **Programs** | Founder **content program pillars** — Podcasts, Sports, Concerts, Community, Education (`/programs`, API `/programs`) |

The founder message lists **content program pillars** (under **Programs**), not Bronze/Gold creator membership tiers:

| What the founder named | What it is in Prysym |
|------------------------|----------------------|
| Podcasts, Sports, Concerts, Community Events, Educational Programs | **`ContentVertical`** + `creator_program_verticals` (which programs a creator publishes in) + `live_events` |
| Viewer Support (tips, donations, super chats, gifts) | `viewer_support_transactions` + `viewer_support` revenue rule |
| Platform Insider $4.99/mo | `platform_insider_subscriptions` (separate from in-app Premium ad-free tiers) |
| Creator Impact Dashboard™ | `GET /analytics/creators/me/dashboard` + `creator_impact_snapshots` |

**Optional admin “partner tier”** (not in founder quote, for future perks): `users.partner_tier` = `standard` \| `rising` \| `partner` \| `flagship`.

**Ads on creator videos:** `content_ad_events` + dashboard fields `adImpressionsOnYourContent*` — frontend must call `POST /ads/track/impression` with `{ campaignId, creatorId, videoId?, placement }` when a preroll/interstitial plays on that creator’s content.

---

## 1. Content verticals (catalog & discovery)

Stakeholder-listed **primary content pillars** (in addition to shorts, movies, live):

| Vertical | Stakeholder intent | Current repo status | Backend action |
|----------|-------------------|---------------------|----------------|
| **Podcasts** | Full podcast hub | ✅ Schema (`podcast_shows`, `podcast_episodes`); 🚧 APIs Week 7; upload type `podcast` in profile | Complete Week 7 + wire `/podcasts` |
| **Sports** | Sports live & VOD | ❌ Gap — no category, event type, or sports hub route | Add `content_vertical` / `event_category`; feeds `GET /feed/sports`; optional league/team metadata |
| **Concerts** | Live & on-demand concerts | ❌ Gap | Model as `live_events` with `type: concert` + ticket sales (Creator Store); LL-HLS or VOD replay |
| **Community Events** | Local/community programming | ❌ Gap | `live_events.type: community`; geo tags; calendar discovery `GET /events/community` |
| **Educational Programs** | Courses & learning content | ❌ Gap | Tie to Creator Store **course sales** + `videos.type` or `programs` table; certificates optional Phase 3 |

**Recommendation:** Introduce a shared **`live_events`** (or extend `streams`) entity with `event_type` enum: `sports | concert | community | education | general` and surface each vertical in home navigation + Typesense facets.

---

## 2. Revenue split rules (must be configurable, not hardcoded)

All percentages below should live in **`revenue_split_rules`** (DB + admin UI) or env **only for dev defaults** — never hardcode in application logic.

### 2.1 Live event revenue (ticket / PPV / live event monetization)

| Party | Share |
|-------|-------|
| Creator | **80%** |
| PRYSYM TV | **15%** |
| GAF (Growth Accommodation Fund) | **5%** |

**Applies to:** Ticket sales, pay-per-view live events, concert/sports/community/education **event** revenue (not generic VOD ads).

**Current plan:** ⚠️ Conflict — Section 10 uses ~30% platform cut on gifts/coins only; **no live-event split** and **no GAF ledger**.

### 2.2 Viewer support revenue (tips, donations, super chats, digital gifts)

| Party | Share |
|-------|-------|
| Creator | **90%** |
| PRYSYM TV | **5%** |
| GAF | **5%** |

**Includes (stakeholder):**

| Mechanism | Current plan | Gap |
|-----------|--------------|-----|
| **Digital gifts** | ✅ `gift_catalog`, `gifts`, coins | ⚠️ Split is 30% platform in plan — **change to 90/5/5** |
| **Tips** | ❌ | Fiat or coin tip endpoint; ledger entry |
| **Donations** | ❌ | One-time USD donations (Stripe); 90/5/5 split |
| **Super Chats** | ⚠️ Deferred in Section 13 | **In scope per stakeholder** — highlighted paid chat message on live/VOD |

---

## 3. Growth Accommodation Fund (GAF)

**Role:** Economic engine behind the ecosystem — funded by platform revenue and reinvested per foundation priorities.

### 3.1 Funding sources (track in `gaf_funding_ledger`)

| Source | In current plan? |
|--------|------------------|
| Advertising revenue | ✅ Partial (`ad_campaigns`) — no GAF allocation |
| Sponsorship revenue | ❌ Module 4 |
| Marketplace revenue | ❌ Creator Store |
| Membership revenue | ⚠️ Partial — creator subs + platform premium; **not** Insider Membership |
| Grants | ❌ |
| Donations | ❌ |

### 3.2 GAF investment priorities (reporting & grant programs)

Stakeholder categories (for **Impact reporting** and future grant workflows):

- **Economic development** — small business grants, startup capital, equipment assistance  
- **Workforce development** — certification, job placement, apprenticeships  
- **Housing initiatives** — down payment assistance, housing stabilization  
- **Youth development** — trades, entrepreneurship, media training  

**Backend:** `gaf_programs`, `gaf_allocations`, `gaf_impact_metrics` (admin + public transparency pages optional).

---

## 4. Creator Impact Dashboard™

Every creator gets a dashboard beyond basic analytics.

### 4.1 Financial metrics

| Metric | Current plan |
|--------|--------------|
| Monthly earnings | ✅ `GET /analytics/creators/me/dashboard` (ledger + snapshots) |
| Ad impressions on **your** videos | ✅ `content_ad_events` + dashboard `advertising.*` |
| Ad revenue (creator share) | ❌ Ads are 100% platform today |
| Sponsorship revenue | ❌ |
| Merchandise revenue | ❌ Creator Store |
| Donations | ❌ |

### 4.2 Performance metrics

| Metric | Current plan |
|--------|--------------|
| Watch hours | 🚧 `analytics_events` |
| Retention | ❌ |
| Subscribers | ✅ follows / subscriptions |
| Engagement | 🚧 Partial (likes, comments) |

### 4.3 Community impact metrics (unique to PRYSYM mission)

| Metric | Current plan |
|--------|--------------|
| Jobs supported | ❌ |
| Businesses funded | ❌ |
| Dollars invested (via GAF attribution) | ❌ |
| Workforce opportunities created | ❌ |

**API target:** `GET /creators/me/impact-dashboard` aggregating financial + performance + impact blocks.

---

## 5. Business advertising infrastructure

Stakeholder wants a **business-facing portal**, not only admin-created campaigns.

### Advertiser capabilities

| Feature | Current plan |
|---------|--------------|
| Audience analytics | ❌ |
| Geographic reach | ❌ |
| Demographics | ❌ |
| Engagement data | ❌ |
| Conversion tracking | ❌ |
| **Community impact reporting** (businesses supported, jobs, economic impact) | ❌ |

**Selling point:** Hospitals, banks, universities, municipalities, corporations — tie ad spend to **measurable community outcomes**.

**APIs (Module 13):** `/advertisers/*` portal — campaign CRUD, analytics export, impact report PDF/JSON.

---

## 6. PRYSYM Creator Store™

Per-creator commerce — **not in current schema**.

| Capability | Status |
|------------|--------|
| Personalized storefront | ❌ |
| Product catalog | ❌ |
| Merchandise integration | ❌ |
| Ticket sales (events) | ❌ |
| Course sales | ❌ |
| Digital product sales | ❌ |

**Tables (proposed):** `creator_stores`, `store_products`, `store_orders`, `store_payout_lines` (with revenue splits).

**APIs (Module 5):** `GET /stores/:creatorSlug`, `POST /stores/me/products`, checkout via Stripe Connect.

---

## 7. Platform Insider Membership

**Distinct from** creator subscription tiers in `ProfileSettingsSheet` PREMIUM_TIERS.

| Attribute | Value |
|-----------|-------|
| Price | **$4.99 / month** (voluntary) |
| Benefits | Early feature access, platform roadmaps, creator town halls, development updates |
| Revenue split | **80%** platform development · **10%** GAF · **10%** Creator Development Fund |

**Current plan:** ⚠️ Conflict — `/premium` tiers ($2.99–$9.99) are **ad-free / badge** benefits, not Insider Membership. Add `platform_insider_subscriptions` or product SKU in Stripe.

---

## 8. Developer implementation modules (14 modules)

Map to backend phases — **none fully built** except fragments of Modules 1, 6, 7, 13.

| # | Module | Scope summary | Plan reference |
|---|--------|---------------|----------------|
| **1** | Creator Management System | Users, streamer apply, roles, profiles, social links | Week 1 ✅ partial |
| **2** | Revenue Distribution Engine | Apply 80/15/5 and 90/5/5 splits; immutable ledger | ❌ **Phase 2** |
| **3** | Advertising Management System | Campaigns, serve, track | Week 8 🚧 |
| **4** | Sponsorship Marketplace | Brand ↔ creator deals | ❌ **Phase 2** |
| **5** | Creator Store Infrastructure | Storefront, products, orders | ❌ **Phase 2** |
| **6** | Donation & Tip Engine | Tips, donations, super chat + gifts | Week 5 partial; expand |
| **7** | Creator Analytics Dashboard | Views, earnings, top content | Week 9 🚧 partial |
| **8** | Impact Dashboard | Community impact metrics | ❌ **Phase 2** |
| **9** | GAF Accounting Ledger | Fund inflows/outflows, allocations | ❌ **Phase 2** |
| **10** | Automated Monthly Payout System | Scheduled creator payouts | ❌ On-demand only today |
| **11** | Tax Documentation System | 1099 / tax forms, W-9 collection | ❌ **Phase 3** |
| **12** | Fraud Detection & Verified View Engine | Bot views, gift fraud, chargebacks | ❌ **Phase 3** |
| **13** | Business Advertising Portal | Self-serve advertiser UI + APIs | ❌ **Phase 2** |
| **14** | Community Impact Reporting System | Advertiser + public impact reports | ❌ **Phase 2** |

---

## 9. Long-term platform vision (product north star)

PRYSYM TV is intended to become simultaneously:

1. A **streaming platform**  
2. A **creator economy platform**  
3. A **digital marketplace** (Creator Store)  
4. A **workforce development engine** (GAF programs)  
5. A **community investment platform** (GAF + impact metrics)  
6. **Economic development infrastructure** (Onyx Repository Foundation mission)

**Governance:** Owned/operated in service of the **Onyx Repository Foundation**.

---

## 10. Gap summary — what we missed in V1 planning

| Area | Missed? | Action |
|------|---------|--------|
| Sports / Concerts / Community / Education verticals | **Yes** | Add content verticals + events model (Section 15 in backend plan) |
| Live event 80/15/5 split | **Yes** | Revenue engine + event checkout |
| Viewer support 90/5/5 split | **Yes** | Replace 30% gift cut; add tips/donations/super chat |
| GAF fund & ledger | **Yes** | Module 9 schema + allocation jobs |
| Creator Impact Dashboard (impact metrics) | **Yes** | Module 8 APIs + UI panel |
| Creator Store | **Yes** | Module 5 |
| Insider Membership $4.99 | **Yes** | New product + split 80/10/10 |
| Business advertiser portal + impact ads | **Yes** | Modules 13–14 |
| Sponsorship marketplace | **Yes** | Module 4 |
| Monthly auto payouts + tax docs | **Yes** | Modules 10–11 |
| Fraud / verified views | **Yes** | Module 12 |
| Super Chat | **Yes** (was deferred) | Include in Module 6 |

---

## 11. Suggested implementation phasing (after current Week 1–10)

| Phase | Weeks (suggested) | Deliverables |
|-------|-------------------|----------------|
| **Phase 2A — Economy core** | 11–12 | Revenue distribution engine, split rules, GAF ledger, tips/donations/super chat, update gift splits |
| **Phase 2B — Commerce & events** | 13–14 | Creator Store, live events (sports/concert/community/education), ticket revenue 80/15/5 |
| **Phase 2C — Growth & ads** | 15–16 | Sponsorship marketplace, business advertiser portal, conversion + impact reporting |
| **Phase 2D — Creator intelligence** | 17–18 | Full Creator Analytics + Impact Dashboard™, Insider Membership |
| **Phase 3 — Trust & compliance** | 19–20 | Monthly payouts automation, tax docs, fraud/verified views |

---

## 12. Frontend routes to add (not in UI yet)

| Route (proposed) | Purpose |
|------------------|---------|
| `/sports` | Sports hub |
| `/concerts` | Concerts hub |
| `/events` | Community events calendar |
| `/learn` or `/education` | Educational programs |
| `/store/[creatorSlug]` | Creator Store storefront |
| `/insider` | Platform Insider Membership |
| `/advertise` | Business advertising portal (B2B) |
| `/impact` | Public GAF / community impact (optional) |

Existing profile **Creator Dashboard** panel should evolve into **Creator Impact Dashboard™** (financial + performance + impact tabs).

---

**Database (applied):** Migration `20260602114129_phase2_economy_schema` adds all Phase 2 tables. Percentages live in `revenue_split_rules` (seed = initial defaults only). Admins change via `PUT /admin/revenue-split-rules/:ruleKey`.

**Maintainers:** When stakeholder rules change, update **this file first**, then sync `backend-development-plan.md` Section 10 (monetization), Section 13 (scope), and `api.md` stubs.

# Stripe production checklist (coins + premium + channel memberships)

Use this when moving from dev mode (no `STRIPE_SECRET_KEY`) to live payments.

## Environment

| Variable | Where | Notes |
|----------|--------|--------|
| `STRIPE_SECRET_KEY` | `api/.env` | `sk_live_...` in production |
| `STRIPE_WEBHOOK_SECRET` | `api/.env` | From Stripe Dashboard → Webhooks → signing secret |
| `FRONTEND_URL` | `api/.env` | Public app URL (checkout success/cancel redirects) |
| `NEXT_PUBLIC_API_URL` | `.env.local` | Must point at production API |

## Stripe Dashboard

1. **Webhook endpoint:** `POST https://<api-host>/billing/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded` (bank debits, etc.)
2. **Products:** Not required — Checkout uses dynamic `price_data` for coins, platform premium, and creator memberships.
3. **Test cards:** `4242...` in test mode; switch to live keys only after smoke tests pass.

## Fulfillment paths (all idempotent)

| Path | When |
|------|------|
| Webhook | Primary — Stripe calls API after payment |
| `GET /billing/stripe/fulfill?session_id=` | Browser redirect fallback (profile or creator page) |
| `POST /billing/stripe/fulfill` | Same, JSON body `{ sessionId }` |

Fulfillment checks:

- Session `payment_status === paid`
- `metadata.userId` matches authenticated user (redirect fulfill only)
- Existing `transactions` row with `status: completed` → returns `alreadyFulfilled`

## Product types (`metadata.productType`)

| Value | Grants |
|-------|--------|
| `coins` | Increments `coinsBalance`; `coin_purchase` revenue split |
| `premium` | Platform ad-free tier 30 days; `insider_membership` / `platform_subscription` split |
| `creator_subscription` | 30-day channel membership; `creator_subscription` split to creator balance |

## Local webhook testing

```bash
stripe listen --forward-to localhost:3000/billing/stripe/webhook
# Copy whsec_... into STRIPE_WEBHOOK_SECRET
```

Complete a test checkout, then confirm webhook logs and DB:

- `transactions.status = completed`
- Coins or `users.premium_expires_at` updated
- `subscriptions` row for creator checkout
- `creator_balance_ledger` credit for gifts / creator subs

## Creator payouts

- `GET /billing/creators/balance` — available USD (credits − debits − pending requests)
- `POST /billing/creators/payouts/request` — min $50; status `requested` until admin approves (no admin UI in V1)

## Launch scope note

- **Platform Premium** (Settings → Premium): site-wide ad-free — `$2.99` / `$4.99` / `$9.99` per 30 days.
- **Channel membership** (creator profile → Join $4.99): supports one creator; distinct from Follow.
- **Platform Insider $4.99** (stakeholder GAF product): schema exists (`platform_insider_subscriptions`); dedicated `/insider` flow is Phase 2.

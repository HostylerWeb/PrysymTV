# Push & in-app notifications

How PrysymTV notifications work, how to set up Firebase for Android push, and how to configure production.

**Related code**

| Area | Path |
|------|------|
| API — create + fan-out | `api/src/notifications/notifications.service.ts` |
| API — FCM + web push delivery | `api/src/notifications/push.service.ts` |
| API — register device | `POST /users/me/push-subscription` |
| Mobile — enable push UI | `mobile/src/lib/push-notifications.ts` |
| Mobile — bell sheet | `mobile/src/components/modals/NotificationsSheet.tsx` |
| Web — bell modal | `components/notifications-modal.tsx`, `components/header.tsx` |
| Notification types & prefs | [`api.md`](../api/api.md) (search “Notification triggers”) |

---

## In-app bell vs OS push

| Channel | Real-time? | When it updates |
|--------|------------|-----------------|
| **In-app bell** | Polling (15s) | **Web:** `lib/hooks/use-notifications.ts` — unread dot + list refresh every 15s while signed in. **Mobile:** `useNotifications` / `useUnreadNotificationCount` — same 15s poll; push receipt also invalidates the query (`PushNotificationSetup.tsx`). |
| **OS push (banner)** | Yes (when configured) | FCM (Android) or web push (browser) via API after a notification row is created. |

Both use the same `notifications` table. Push is optional; the bell works if the user is signed in.

**Like notifications** go to the **video owner**, not the person who liked. To re-test likes: unlike → delete notification row (or clear all) → like again.

---

## Notification types (summary)

All respect `GET/PUT /users/me/notification-preferences` (default: on).

| Pref | Trigger |
|------|---------|
| `follow` | New follower |
| `like` | Like on your video or comment |
| `comment` | Comment or reply on your content |
| `gift` | Gift received on stream |
| `live` | Creator you enabled **live alerts** for goes live (not all followers) |
| `upload` | Someone you follow publishes new content |
| `system` | Upload processing started / complete / failed (uploader) |

Full table: [`api.md` — Notification triggers](../api/api.md).

---

## Architecture

```
Event (like, follow, …)
  → notifications.service (DB row)
  → push.service.sendForNotification()
       ├─ Web: VAPID + web-push (endpoint = browser push URL)
       └─ Android/iOS: Firebase Admin SDK (endpoint = fcm:<token> or apns:<token>)
```

Mobile registers via the **same** `POST /users/me/push-subscription` as web, with:

- `endpoint`: `fcm:<device_token>` (Android) or `apns:<token>` (iOS)
- `keys`: `{ p256dh: "device", auth: "device" }` (placeholders; not used for FCM)

---

## Firebase setup (Android push)

Project in use: **`prysymtv-8891f`**  
Android package: **`com.prysymtv.app`**

### 1. Firebase Console

1. [Firebase Console](https://console.firebase.google.com/) → project **prysymtv-8891f**
2. **Project settings** → **Your apps** → Android app with package `com.prysymtv.app`
   - If missing: Add app → Android → package `com.prysymtv.app`
3. Download **`google-services.json`** → place at **`mobile/google-services.json`**
   - Template: `mobile/google-services.json.example`
   - **Do not commit** `google-services.json` (contains API keys; gitignored)
4. Rebuild the APK after changing this file: `npm run prebuild:clean && npm run build:apk:release`

### 2. Service account (API / FCM server)

Required for the API to **send** push to devices.

1. Firebase Console → **Project settings** → **Service accounts**
2. **Generate new private key** → saves JSON like `prysymtv-8891f-firebase-adminsdk-….json`
3. Store securely on the VPS (not in git):

```bash
# On VPS (example)
scp prysymtv-8891f-firebase-adminsdk-….json root@YOUR_VPS:/etc/prysym/firebase-adminsdk.json
ssh root@YOUR_VPS 'chown prysym:prysym /etc/prysym/firebase-adminsdk.json && chmod 640 /etc/prysym/firebase-adminsdk.json'
```

4. On the VPS, point the API at the file (recommended — avoids systemd corrupting inline JSON in `api/.env`):

```bash
# On VPS
chown prysym:prysym /etc/prysym/firebase-adminsdk.json
chmod 640 /etc/prysym/firebase-adminsdk.json

# In /var/www/prysymtv/api/.env — use PATH, not inline JSON:
FIREBASE_SERVICE_ACCOUNT_PATH=/etc/prysym/firebase-adminsdk.json

# Remove any broken FIREBASE_SERVICE_ACCOUNT_JSON= line if present
sed -i '/^FIREBASE_SERVICE_ACCOUNT_JSON=/d' /var/www/prysymtv/api/.env

systemctl restart prysym-api
```

**Why not inline JSON?** `prysym-api.service` loads `EnvironmentFile=api/.env`. Multi-line or escaped JSON in that file is often mangled before Node starts, causing `FCM init failed: Failed to parse private key`.

**Env var (preferred):** `FIREBASE_SERVICE_ACCOUNT_PATH`  
**Fallback:** `FIREBASE_SERVICE_ACCOUNT_JSON` (single-line minified JSON — only if not using systemd `EnvironmentFile`)  
**Read by:** `api/src/notifications/push.service.ts`

If missing or unreadable, API logs: `FCM delivery skipped: Firebase service account not configured or invalid` — in-app bell still works; Android banners do not.

### 3. Rotate / replace keys

| Secret | When to rotate | Action |
|--------|----------------|--------|
| Firebase **service account** JSON | Leaked, staff change, yearly policy | Firebase Console → Service accounts → **Generate new private key** → replace `/etc/prysym/firebase-adminsdk.json` → `systemctl restart prysym-api` → delete old key in Console |
| **`google-services.json`** | New Android app / package rename | Re-download from Firebase → `mobile/google-services.json` → rebuild APK |
| **VAPID** keys (web push) | Compromise | Generate new pair → `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` in `api/.env` → users re-subscribe in browser |

Never commit service account JSON or production `google-services.json` to GitHub.

---

## Web push (browser)

Separate from Firebase FCM.

| Env (api `.env`) | Purpose |
|------------------|---------|
| `VAPID_PUBLIC_KEY` | Exposed via `GET /push/vapid-public-key` |
| `VAPID_PRIVATE_KEY` | Server-only |
| `VAPID_SUBJECT` | e.g. `mailto:support@prysym.tv` |

Web subscriptions use standard Web Push endpoints (`https://fcm.googleapis.com/fcm/send/...` or browser-specific URLs), not the `fcm:` prefix.

---

## Production checklist (srv1765056.hstgr.cloud)

- [ ] `mobile/google-services.json` on build machine (for release APK)
- [ ] `/etc/prysym/firebase-adminsdk.json` on VPS (`chown prysym:prysym`, `chmod 640`)
- [ ] `FIREBASE_SERVICE_ACCOUNT_PATH=/etc/prysym/firebase-adminsdk.json` in `/var/www/prysymtv/api/.env`
- [ ] `VAPID_*` set for web push (optional)
- [ ] `systemctl restart prysym-api` after env changes
- [ ] User enables push in app **while signed in** (Settings → Notifications)
- [ ] Verify registration:

```bash
docker exec prysym-postgres psql -U prysym -d prysymtv -c \
  "SELECT left(endpoint, 24) AS prefix, user_agent, created_at FROM push_subscriptions ORDER BY created_at DESC LIMIT 5;"
```

Expect Android rows with prefix **`fcm:`** and a mobile user agent.

### Clear notifications (testing)

```bash
docker exec prysym-postgres psql -U prysym -d prysymtv -c "DELETE FROM notifications;"
```

To re-test **likes**: unlike in the app, then like again (likes are deduped in `likes` table).

---

## Mobile app — user flow

1. Sign in
2. Settings → Notifications → enable **Push notifications** (OS permission prompt)
3. Token sent to `POST /users/me/push-subscription`
4. Toggle per-type prefs on same screen (`follow`, `like`, `comment`, …)

Implementation: `mobile/src/components/settings/PushNotificationToggle.tsx`, `PushNotificationSetup.tsx` (tap notification → deep link).

---

## Android notification icon (status bar + tray)

Android **does not** use your full-color launcher icon for push. It requires a separate **small icon**: white silhouette on a transparent background (~96×96 PNG). Without it you get a generic grey square or no icon.

### App-side (required)

1. Asset: `mobile/assets/notification-icon.svg` (source) and `notification-icon.png` (generated). **Do not** rely on `expo prebuild` alone — it can bake in a generic Android silhouette. Always run `node scripts/generate-notification-icons.js` before release builds (wired into `scripts/build-android.sh`).
2. `app.json` — `expo-notifications` plugin:

```json
[
  "expo-notifications",
  {
    "icon": "./assets/notification-icon.png",
    "color": "#EF511D",
    "defaultChannel": "default"
  }
]
```

3. Regenerate native Android resources and rebuild the APK:

```bash
cd mobile
npx expo prebuild --platform android
npm run build:apk:release
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Prebuild writes `@drawable/notification_icon` and tints it with `#EF511D` (see `AndroidManifest.xml` meta-data).

### What professional Android apps show

| Element | What users see | PrysymTV |
|---------|----------------|----------|
| **Status bar / collapsed** | White brand mark on a tinted circle (your brand color) | Owl silhouette + `#EF511D` accent |
| **Notification row** | App name, title, body — no promo image on the right | Title + message only |
| **Large picture** | Only for content previews (e.g. a video thumbnail) | **Not used** for social notifications |

Do **not** set FCM `android.notification.imageUrl` for likes/follows — that adds an unnecessary image on the right. The small icon comes from the APK; iOS uses the app icon automatically.

**Server payload:** send both a `notification` block (title/body — required for OS banners when the app is backgrounded or closed) **and** a `data` block (`title`, `message`, `channelId`, `url`, … for Expo deep links). Do **not** set `android.notification.icon` or `imageUrl` in the FCM payload — Android uses `com.google.firebase.messaging.default_notification_icon` from the APK manifest (`@drawable/notification_icon`).

---

## Production incident log (Aug 2026)

Symptoms: in-app bell worked; Android OS banners never appeared; API logs showed:

```
FCM init failed: Failed to parse private key: DECODER routines::unsupported
FCM delivery skipped: Firebase service account not configured or invalid
```

**Root causes (both had to be fixed):**

| Issue | Fix |
|-------|-----|
| `/etc/prysym/firebase-adminsdk.json` was `root:root` mode `600` — API runs as `prysym` | `chown prysym:prysym` + `chmod 640` |
| Inline `FIREBASE_SERVICE_ACCOUNT_JSON` in `api/.env` corrupted by systemd `EnvironmentFile` | Use `FIREBASE_SERVICE_ACCOUNT_PATH=/etc/prysym/firebase-adminsdk.json`; delete the JSON line |
| Old `push.service.ts` only read inline JSON | Deploy version that loads from file path (`loadFirebaseServiceAccount`) |

**Verify FCM after deploy:**

```bash
# API healthy
curl -sf http://127.0.0.1:4000/api/v1/health

# Recent push subs (expect fcm: prefix on Android)
docker exec prysym-postgres psql -U prysym -d prysymtv -c \
  "SELECT left(endpoint, 28), user_agent FROM push_subscriptions ORDER BY created_at DESC LIMIT 3;"

# Direct FCM test (replace TOKEN with full token after fcm: prefix)
su - prysym -c 'cd /var/www/prysymtv/api && node -e "
const admin = require(\"firebase-admin\");
const sa = require(\"/etc/prysym/firebase-adminsdk.json\");
admin.initializeApp({ credential: admin.credential.cert(sa) });
admin.messaging().send({
  token: \"TOKEN\",
  notification: { title: \"Test\", body: \"FCM OK\" },
  android: { priority: \"high\", notification: { channelId: \"default\", icon: \"notification_icon\", color: \"#EF511D\" } },
}).then(id => console.log(\"OK\", id)).catch(e => console.error(e.message));
"'
```

**Real-time bell (no WebSocket):** clients poll `GET /users/me/notifications` every **15 seconds** when authenticated (`NOTIFICATIONS_POLL_MS` in `lib/hooks/use-notifications.ts` and `mobile/src/hooks/api/useNotifications.ts`).

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Bell works, no phone banner | `FIREBASE_SERVICE_ACCOUNT_PATH` missing, file not readable by `prysym` user, or API not restarted |
| Bell works, no phone banner | API logs `Failed to parse private key` — remove inline `FIREBASE_SERVICE_ACCOUNT_JSON`; use file path instead |
| Shows Android robot head | `expo prebuild` overwrote drawables — run `node scripts/generate-notification-icons.js` then rebuild APK |
| Random logo image on the right of notification | Remove `imageUrl` from FCM payload (`api/src/notifications/push.service.ts`) |
| Bell badge stale | Should auto-refresh every 15s; force refresh by opening app or toggling auth |
| Bell works, no phone banner | No `fcm:` row in `push_subscriptions` for that user — re-enable push while logged in |
| Bell works, no phone banner | Testing as **liker** instead of **video owner** |
| No new like notification after first | Unlike first; `dedupeKey` blocks duplicate until unlike |
| Google button 403 on web | Placeholder OAuth client ID — set real `GOOGLE_CLIENT_ID` in `api/.env` |
| `sudo: unknown user postgres` on VPS | DB is in Docker — use `docker exec prysym-postgres psql ...` |

---

*Last updated: 2026-08-04 — Firebase `prysymtv-8891f`, package `com.prysymtv.app`, production path `/etc/prysym/firebase-adminsdk.json`, 15s bell polling, Android `notification-icon.png`.*

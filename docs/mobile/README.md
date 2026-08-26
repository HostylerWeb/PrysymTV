# PrysymTV Mobile (Expo)

React Native app for PrysymTV, built with [Expo](https://expo.dev).

## Stack

- Expo SDK **54**
- React **19**
- React Native **0.81**
- TanStack Query for API caching

## Test on device — APK builds

This project uses **local Android APK builds**, not Expo Go.

### Prerequisites (Linux)

- Android Studio + Android SDK (`~/Android/Sdk`)
- Java **17+** — Android Studio’s bundled JBR is used automatically (`/snap/android-studio/current/jbr`)
- Phone connected via USB with USB debugging on

Optional `~/.bashrc`:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export JAVA_HOME="/snap/android-studio/current/jbr"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

### First-time setup

```bash
cd mobile
npm install
npx expo install --fix
npm run prebuild:clean
```

Copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_API_URL`.

---

## Standalone APK (recommended for phone testing)

**Use release** — JS is bundled inside the APK. No Metro, no PC needed after install.

```bash
npm run build:apk:release
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

**Release signing (Firebase SHA, Play Store):** [`android-release-signing.md`](./android-release-signing.md)

For **JS/UI-only changes** on devices that already have an OTA-enabled APK, use [OTA updates](#ota-updates-self-hosted) below — no APK rebuild required.

Rebuild the APK when you change **native** code (new Expo modules, permissions, `app.json` Android config, keystore, etc.).

---

## OTA updates (self-hosted)

PrysymTV does **not** use EAS Update. The mobile app uses [`expo-updates`](https://docs.expo.dev/versions/latest/sdk/updates/) with a self-hosted [**xprem**](https://github.com/mercuretechnologies/xprem) server on the production VPS.

| | OTA publish | APK rebuild |
|---|-------------|-------------|
| **What changes** | React/TS UI, hooks, API client code | Native modules, permissions, signing, `app.config` native plugins |
| **User action** | App shows “Update available” → **Restart now** | Uninstall old app + install new APK |
| **Command** | `npm run publish:ota` | `npm run build:release:ota` |

Metro live reload is **not** OTA. Editing files on the VPS does nothing until you publish a bundle.

### How it works (on the phone)

1. App checks `https://srv1765056.hstgr.cloud/ota/manifest` on launch and when returning to foreground.
2. If a newer JS bundle exists, it downloads in the background.
3. User gets a notification and/or bottom sheet: **Restart now** (calls `Updates.reloadAsync()`).
4. **Later** dismisses the prompt for that update until the app is fully killed and reopened.

Runtime version policy: **`appVersion`** (must match `version` in `app.json`, currently `1.0.0`). Bump `app.json` version when you need a new APK track.

### First-time setup (once per machine / new OTA app)

**1. OTA server on VPS** — included in full deploy (`infra/vps/deploy.sh`). Health check:

```bash
curl -fsS https://srv1765056.hstgr.cloud/ota/hc
```

Or run manually from your laptop (needs SSH password in `infra/vps/.deploy-pass` or `PRYSYM_SSH_PASS`):

```bash
bash scripts/deploy-ota-vps.sh
```

**2. Bootstrap app on xprem** (creates app ID, branch, channel, publish API key, downloads signing cert):

```bash
XPREM_URL=https://srv1765056.hstgr.cloud/ota \
XPREM_ADMIN_EMAIL=admin@prysym.tv \
XPREM_ADMIN_PASSWORD='…' \
bash scripts/bootstrap-xprem.sh
```

Writes gitignored secrets to `infra/ota/bootstrap.secrets.env` and `mobile/certs/certificate.pem`. Admin password is in `infra/ota/.env` on the VPS (created on first OTA deploy).

**3. Build and install an OTA-enabled release APK** (once per native change or new signing key):

```bash
cd mobile
npm run build:release:ota
adb install -r releases/prysymtv-android-release-YYYYMMDD.apk
```

This embeds the OTA URL, app ID, and code-signing certificate in the binary.

### Push a JS/UI update (day-to-day)

From a **clean git tree** (`eoas publish` refuses dirty working trees):

```bash
cd mobile
git add -A && git commit -m "your message"   # commit first
npm run publish:ota
```

Optional env overrides: `OTA_PLATFORM=android`, `OTA_MESSAGE="Fix shorts tab"`, `RELEASE_CHANNEL=production`.

Users on an OTA-enabled APK receive the update automatically; they tap **Restart now** to apply.

### Key files

| Path | Purpose |
|------|---------|
| `mobile/app.config.ts` | OTA URL, channel, branch when `EXPO_OTA_APP_ID` is set |
| `mobile/scripts/publish-ota.sh` | Export bundle + upload via `eoas` |
| `mobile/scripts/build-release-with-ota.sh` | Prebuild with OTA config + signed release APK |
| `scripts/bootstrap-xprem.sh` | Register app on xprem, create API key |
| `scripts/deploy-ota-vps.sh` | Start xprem Docker stack + nginx routes on VPS |
| `infra/ota/docker-compose.yml` | xprem + Postgres (`127.0.0.1:3011`) |
| `infra/ota/bootstrap.secrets.env` | App ID, publish token — **gitignored** |
| `infra/ota/.env` | VPS xprem secrets — **gitignored** |

### Troubleshooting

| Problem | Fix |
|---------|-----|
| `eoas publish` says dirty working tree | Commit or stash changes before publishing |
| App crashes after OTA | Bad bundle was published; publish a fix or `adb shell pm clear com.prysymtv.android` + reinstall APK |
| No update prompt | Force-close and reopen app; ensure APK was built with `build:release:ota` |
| `EOO_TOKEN` missing | Run `scripts/bootstrap-xprem.sh` |

VPS/nginx details: [`../vps/vps-production.md`](../vps/vps-production.md#mobile-ota-self-hosted-xprem). Deploy checklist: root [`INSTRUCTIONS.txt`](../../INSTRUCTIONS.txt).

---

## Debug APK + Metro (live reload on device)

**Debug APK does not include JS.** You must run Metro on your PC.

Terminal 1:

```bash
npm run dev:android
```

Terminal 2 (install debug APK once):

```bash
npm run build:apk:debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

`dev:android` runs `adb reverse tcp:8081 tcp:8081` so the phone reaches Metro over USB.

---

## Debug errors via ADB

```bash
npm run log:android
```

---

## API & references

- **All documentation:** [`../README.md`](../README.md)
- **Canonical API docs:** [`../api/api.md`](../api/api.md)
- **Push notifications (Firebase, FCM, testing):** [`notifications.md`](./notifications.md)
- **Run guide (API + web):** [`../web/how-to-run.md`](../web/how-to-run.md)
- **Web UX reference:** `app/`, `components/`, `lib/api/` in repo root

Production API: `https://srv1765056.hstgr.cloud/api/v1`

The mobile app uses the same REST endpoints as the website (`/feed/home`, `/videos/:id`, `/analytics/track`, etc.). See `mobile/src/lib/api/` for client modules.

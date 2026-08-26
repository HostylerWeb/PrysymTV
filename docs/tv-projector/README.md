# PrysymTV — Android TV / Projector

Viewer-focused PrysymTV client for Android TV and projectors. Built with Expo SDK 54 and `react-native-tvos`.

## Prerequisites

- Node.js 20+
- Android Studio with Android SDK
- Android TV emulator or physical Android TV device
- JDK 17+ (Android Studio JBR works)

## Setup

```bash
cd tv-projector
npm install
```

## Development

Start Metro:

```bash
npm start
```

Generate native Android TV project (required before first run):

```bash
npm run prebuild
```

Run on Android TV emulator or device:

```bash
npm run android
```

`EXPO_TV=1` is set automatically by the `prebuild` script so `@react-native-tvos/config-tv` applies TV launcher icons and manifest changes.

## Build release APK

```bash
npm run prebuild:clean
npm run build:apk:release
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

Stamped copy: `releases/prysymtv-tv-release-YYYYMMDD.apk`

Install on a connected device/emulator:

```bash
npm run install:apk:release
```

## Release signing

Production APKs use a local release keystore (never commit):

| File | Purpose |
|------|---------|
| `android/app/prysymtv-tv-release.keystore` | Release signing key |
| `android/keystore.properties` | Passwords + alias (see `keystore.properties.example`) |

After `npm run prebuild:clean`, re-apply signing:

```bash
bash scripts/patch-android-release-signing.sh
```

Restore `keystore.properties` and `prysymtv-tv-release.keystore` if prebuild removed them.

Local credentials backup (passwords + SHA fingerprints): `credentials/android-release.local.txt` — **gitignored**.

---

## OTA updates (self-hosted)

Same xprem server as the phone app, but a **separate OTA app** (`PrysymTV TV`) so TV and phone bundles do not mix.

| | OTA publish | APK rebuild |
|---|-------------|-------------|
| **What changes** | React/TS UI, hooks, API client | Native modules, permissions, `app.json` plugins |
| **User action** | On-screen **Restart now** / **Later** prompt | Install new APK |
| **Command** | `npm run publish:ota` | `npm run build:release:ota` |

### First-time setup

```bash
# From repo root (needs xprem admin login)
XPREM_URL=https://srv1765056.hstgr.cloud/ota \
XPREM_ADMIN_EMAIL=admin@prysym.tv \
XPREM_ADMIN_PASSWORD='…' \
bash scripts/bootstrap-xprem-tv.sh
```

Writes `infra/ota/bootstrap-tv.secrets.env` and `tv-projector/certs/certificate.pem` (gitignored).

Build and install an OTA-enabled release APK:

```bash
cd tv-projector
npm run build:release:ota
adb install -r releases/prysymtv-tv-release-YYYYMMDD.apk
```

### Push a JS/UI update

```bash
cd tv-projector
git commit …   # eoas requires clean git tree
npm run publish:ota
```

Phone OTA docs: [`../mobile/README.md`](../mobile/README.md#ota-updates-self-hosted).

---

Package name: **`com.prysymtv.tv`**. If you add the app in Firebase or Google Cloud, register this package and the release SHA-1 from your keystore.

## Android TV emulator

1. Open Android Studio → Device Manager → Create Virtual Device
2. Choose **TV** category (e.g. Android TV 1080p)
3. Use a system image with Google APIs (API 34+ recommended)
4. Start the emulator, then run `npm run android`

## Configuration

| Setting | Value |
|---------|-------|
| App name | PrysymTV |
| Android package | `com.prysymtv.tv` |
| API URL | `https://srv1765056.hstgr.cloud/api/v1` (in `app.json` → `extra.apiUrl`) |

Override API URL for local dev:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api/v1 npm start
```

## Typecheck

```bash
npm run typecheck
```

## Scope

This app is **viewer-only**: browse home feed, videos, movies, search, login, and watch playback. No upload, go-live, creator dashboard, notifications, or camera features.

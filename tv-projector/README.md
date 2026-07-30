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

Install on a connected device/emulator:

```bash
npm run install:apk:release
```

## Android TV emulator

1. Open Android Studio → Device Manager → Create Virtual Device
2. Choose **TV** category (e.g. Android TV 1080p)
3. Use a system image with Google APIs (API 34+ recommended)
4. Start the emulator, then run `npm run android`

## Configuration

| Setting | Value |
|---------|-------|
| App name | PrysymTV |
| Android package | `tv.prysym.app.tv` |
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

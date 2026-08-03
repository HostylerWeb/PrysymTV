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

Rebuild after **any** JS/UI change.

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

- **Canonical API docs:** [`../guides-md-files/api.md`](../guides-md-files/api.md)
- **Run guide (API + web):** [`../guides-md-files/how-to-run.md`](../guides-md-files/how-to-run.md)
- **Web UX reference:** `app/`, `components/`, `lib/api/` in repo root

Production API: `https://srv1765056.hstgr.cloud/api/v1`

The mobile app uses the same REST endpoints as the website (`/feed/home`, `/videos/:id`, `/analytics/track`, etc.). See `mobile/src/lib/api/` for client modules.

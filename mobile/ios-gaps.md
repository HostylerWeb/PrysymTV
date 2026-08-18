# PrysymTV iOS — gaps & setup checklist

Single source of truth for everything still needed to ship a **functional** iOS app.  
Android local APK flow: [`../docs/mobile/README.md`](../docs/mobile/README.md).

**You have:** Apple Developer account, MacBook with Xcode, shared React Native / Expo codebase (`mobile/`).

**Last reviewed:** 2026-08-07

---

## Quick status

| Area | Android today | iOS |
|------|---------------|-----|
| App code (UI, API, video) | ✅ Same codebase | ✅ Same — no rewrite |
| Native project (`android/` / `ios/`) | ✅ `android/` after prebuild | ❌ Run `expo prebuild --platform ios` |
| Bundle / package ID | `com.prysymtv.android` (Android) / `com.prysymtv.app` (iOS) | ✅ in `app.json` |
| Local build scripts | ✅ `build-android.sh`, npm scripts | ❌ No iOS build doc/scripts yet |
| Firebase config file | ✅ `google-services.json` | ✅ `GoogleService-Info.plist` (local; gitignored) |
| Push (lock-screen banners) | ✅ FCM | ❌ APNs key + Firebase iOS app |
| Google Sign-In | ✅ | ✅ iOS OAuth client + `iosClientId` in native configure |
| Apple Sign-In | N/A | ⚠️ Needs Apple Developer + API `APPLE_CLIENT_ID` |
| App Store / TestFlight | N/A (APK sideload) | ❌ App Store Connect setup |

---

## What works without extra iOS work

After a signed debug/release build on device, these should work using production API  
(`https://srv1765056.hstgr.cloud/api/v1` — set in `app.json` → `extra.apiUrl`):

- Home feed, movies, verticals, podcasts browse
- Video playback (`expo-video`)
- Email/password login & register
- Profile, comments, likes, saves
- Creator upload flow (with photo library permission from `expo-image-picker` plugin)
- In-app notification bell (15s polling — same as web/Android)

---

## Tier 1 — Required for first iPhone build

### 1. `app.json` — add bundle identifier

Android package is `com.prysymtv.android`. iOS bundle ID:

```json
"ios": {
  "bundleIdentifier": "com.prysymtv.app",
  "supportsTablet": true,
  "infoPlist": {
    "NSCameraUsageDescription": "PrysymTV uses your camera for live broadcasts.",
    "NSMicrophoneUsageDescription": "PrysymTV uses your microphone for live broadcasts."
  }
}
```

> Photo picker permission string is injected by `expo-image-picker` plugin in `app.json`.

### 2. Apple Developer — register App ID

1. [Identifiers](https://developer.apple.com/account/resources/identifiers/list) → **+** → App IDs → App  
2. Bundle ID: **Explicit** → `com.prysymtv.app`  
3. Enable capabilities you need now (can add later):
   - **Push Notifications** (if doing Tier 3)
   - **Sign in with Apple** (if doing Tier 2 social login)

### 3. First build on Mac

```bash
cd mobile
npm install
npx expo install --fix          # align Expo SDK 54 deps
npx expo prebuild --platform ios
cd ios && pod install && cd ..
npm run ios                     # simulator
# OR: open ios/PrysymTV.xcworkspace in Xcode → select Team → Run on device
```

**Prerequisites on Mac:**

- Xcode (from App Store) + command line tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`
- Node 18+ (match project)

### 4. Xcode signing

1. Open `ios/PrysymTV.xcworkspace` (not `.xcodeproj`)
2. Target **PrysymTV** → **Signing & Capabilities**
3. Team: your Apple Developer team
4. Bundle Identifier: `com.prysymtv.app`
5. Connect iPhone → trust computer → Run

### 5. API URL (optional override)

Default is in `app.json` → `extra.apiUrl`. For local API during dev, copy `.env.example` → `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_MAC_LAN_IP:4000/api/v1
EXPO_PUBLIC_WS_URL=http://YOUR_MAC_LAN_IP:4000
```

Simulator can use `localhost` only if API runs on the same Mac.

### 6. Rebuild when

| Change | Action |
|--------|--------|
| JS/TS only (release build) | Xcode **Product → Clean** → Archive / Run |
| `app.json` plugins, icons, permissions | `npx expo prebuild --platform ios --clean` → `pod install` → rebuild |
| Native dependency added | `pod install` → rebuild |

---

## Tier 2 — Social login (Google / Apple / Facebook)

Apple **requires Sign in with Apple** on iOS if you also offer Google or Facebook.

### Apple Sign-In

| Step | Where |
|------|--------|
| Enable capability | Apple Developer → App ID `com.prysymtv.app` → Sign in with Apple |
| App code | Already uses `expo-apple-authentication` (`OAuthSignInButtons.tsx`) |
| API env | `APPLE_CLIENT_ID=web_service_id,com.prysymtv.app` (comma-separated) |
| API docs | `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID` format in [`../docs/api/api.md`](../docs/api/api.md) |
| VPS | Set in `api/.env` → `sudo systemctl restart prysym-api` |
| Verify | `GET /config/public` → `auth.apple.enabled` true, `iosClientId` set |

**Notes:**

- Native Apple button only shows on iOS when `appleClientId` is configured and device supports it.
- Backend: `POST /auth/oauth/apple` with `identityToken` (+ optional `authorizationCode`).

### Google Sign-In (iOS)

| Step | Where |
|------|--------|
| Create OAuth client | [Google Cloud Console](https://console.cloud.google.com/) → APIs → Credentials → **iOS** → bundle `com.prysymtv.app` |
| API env | `GOOGLE_CLIENT_ID=web_client_id,ios_client_id,android_client_id` (exact order — see `oauth-public.config.ts`) |
| VPS | Restart API after env change |

**Code gap (fix before relying on Google on iOS):**

`NativeGoogleSignInButton` in `src/components/auth/OAuthSignInButtons.tsx` only calls:

```ts
GoogleSignin.configure({ webClientId, offlineAccess: false });
```

For iOS it should also pass `iosClientId` from `GET /config/public` → `auth.google.iosClientId`.  
Prebuild may add URL scheme for reversed iOS client ID via `@react-native-google-signin/google-signin` plugin.

### Facebook Sign-In (iOS)

| Step | Where |
|------|--------|
| Add iOS platform | [Facebook Developers](https://developers.facebook.com/) → your app → Settings → iOS |
| Bundle ID | `com.prysymtv.app` |
| API env | `FACEBOOK_APP_ID` (already used on Android) |
| URL scheme | May need Facebook app ID in `app.json` / Info.plist after prebuild — test on device |

---

## Tier 3 — Push notifications (lock-screen banners)

In-app bell works without this. OS banners need APNs + Firebase.

### Firebase (project: `new-prysymtv`)

| Step | Action |
|------|--------|
| 1 | Firebase Console → Add **iOS app** → bundle `com.prysymtv.app` |
| 2 | Download **`GoogleService-Info.plist`** → `mobile/GoogleService-Info.plist` |
| 3 | Add to `app.json`: `"ios": { "googleServicesFile": "./GoogleService-Info.plist", ... }` |
| 4 | **Do not commit** plist if it contains secrets (gitignore like `google-services.json`) |
| 5 | `npx expo prebuild --platform ios --clean` |

Template: add `GoogleService-Info.plist.example` (without secrets) when plist is obtained.

### Apple Push Notification service (APNs)

| Step | Action |
|------|--------|
| 1 | Apple Developer → **Keys** → **+** → Apple Push Notifications service (APNs) |
| 2 | Download `.p8` key (once only — store safely) |
| 3 | Note Key ID and Team ID |
| 4 | Firebase → Project settings → **Cloud Messaging** → Apple app config → upload APNs auth key |

### App ID capability

- App ID `com.prysymtv.app` → enable **Push Notifications**

### How mobile registers (already implemented)

- `src/lib/push-notifications.ts` → `getDevicePushTokenAsync()` → `apns:<token>` endpoint
- `POST /users/me/push-subscription` (same as Android FCM)
- Backend: `api/src/notifications/push.service.ts` via Firebase Admin SDK

### Test push on iOS

1. Build release or development provisioning with push entitlement
2. Sign in → allow notifications when prompted
3. Trigger like/follow from another account
4. See [`../docs/mobile/notifications.md`](../docs/mobile/notifications.md)

---

## Tier 4 — TestFlight & App Store

| Item | Notes |
|------|--------|
| App Store Connect | Create app → bundle `com.prysymtv.app` |
| Archive | Xcode → Product → Archive → Distribute → TestFlight |
| Privacy policy URL | Required for submission |
| Screenshots | 6.7" and 6.5" iPhone (minimum) |
| App Privacy questionnaire | Data collection (account, email, usage, etc.) |
| Age rating | Content questionnaire |
| Export compliance | Usually “No” for standard HTTPS media app |
| Review notes | Test account credentials for Apple reviewers |
| Sign in with Apple | Mandatory if Google/Facebook offered |

---

## Repo / code gaps (not Apple portal)

Track these in git when ready:

- [ ] `app.json` — `ios.bundleIdentifier`
- [ ] `app.json` — `ios.googleServicesFile` (after Firebase iOS app)
- [ ] `GoogleService-Info.plist` — obtain from Firebase (gitignored)
- [ ] `OAuthSignInButtons.tsx` — pass `iosClientId` to `GoogleSignin.configure` on iOS
- [ ] `package.json` — optional scripts: `prebuild:ios`, `build:ios` (mirror Android)
- [ ] `docs/mobile/ios.md` — step-by-step build guide (optional; this file is the checklist)
- [ ] `plugins/withNotificationLargeIcon.js` — Android only (OK; no iOS equivalent needed)

**Already OK for iOS:**

- `expo-apple-authentication` in dependencies + plugins
- `scheme: "prysymtv"` for deep links
- Camera/mic `infoPlist` strings
- `expo-notifications` plugin
- Push registration uses `apns:` prefix on iOS
- Secure token storage via `expo-secure-store`
- Production API URL in `extra.apiUrl`

---

## API / VPS environment variables

Set on production (`/var/www/prysymtv/api/.env`) when enabling features:

```env
# Google: web,ios,android client IDs (comma-separated, this order)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com,yyy-ios.apps.googleusercontent.com,zzz-android.apps.googleusercontent.com

# Apple: web service ID, iOS bundle ID (comma-separated)
APPLE_CLIENT_ID=com.prysym.web,com.prysymtv.app

# Facebook (same as web/Android)
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
```

Restart after changes: `sudo systemctl restart prysym-api`

Verify: `curl -s https://srv1765056.hstgr.cloud/api/v1/config/public | jq .auth`

---

## Apple Developer portal checklist

Copy/paste and tick off:

```
[ ] Enrolled in Apple Developer Program (active)
[ ] App ID created: com.prysymtv.app
[ ] Sign in with Apple enabled on App ID (if social login)
[ ] Push Notifications enabled on App ID (if push banners)
[ ] APNs Auth Key (.p8) created and saved
[ ] Development / Distribution certificates (Xcode can auto-manage)
[ ] Device UDIDs registered (for ad-hoc dev installs if not using TestFlight)
[ ] App Store Connect app record created
[ ] TestFlight internal testers added
```

---

## Firebase checklist (iOS)

```
[ ] iOS app added to new-prysymtv (bundle com.prysymtv.app)
[ ] GoogleService-Info.plist downloaded → mobile/
[ ] APNs .p8 uploaded in Firebase Cloud Messaging
[ ] app.json updated with googleServicesFile
[ ] expo prebuild --platform ios --clean
[ ] Test device token registers (check API push_subscriptions or logs)
```

---

## Google Cloud checklist (iOS OAuth)

```
[ ] iOS OAuth 2.0 Client ID created (bundle com.prysymtv.app)
[ ] iOS client ID added as 2nd entry in GOOGLE_CLIENT_ID on API
[ ] Code fix: GoogleSignin.configure includes iosClientId
[ ] Test Google login on physical iPhone (simulator may differ)
```

---

## Mac build commands (cheat sheet)

```bash
# First time / after app.json native changes
cd mobile
npm install
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..

# Simulator
npm run ios

# Device / release
open ios/PrysymTV.xcworkspace
# Xcode: select iPhone → Run (debug) or Product → Archive (TestFlight)

# Live reload on device (like Android debug + Metro)
npx expo start --dev-client
# Requires dev client build once in Xcode
```

---

## Testing checklist (before calling iOS “done”)

```
[ ] Cold start → splash → home loads
[ ] Watch a video (HLS playback)
[ ] Login / register (email)
[ ] Apple Sign-In (if configured)
[ ] Google Sign-In (if configured + code fix)
[ ] Profile photo upload
[ ] Creator video upload
[ ] Movie browse / movie detail page
[ ] Live stream watch (if applicable)
[ ] Push notification banner (if Tier 3 done)
[ ] In-app notification bell
[ ] Sign out / sign back in
[ ] App backgrounded and resumed during video
[ ] Deep link / share link opens app (scheme prysymtv)
```

---

## Android vs iOS workflow (same repo)

| Task | Android | iOS |
|------|---------|-----|
| Prebuild | `npm run prebuild:clean` (android) | `npx expo prebuild --platform ios --clean` |
| Release artifact | APK in `android/app/build/outputs/` | `.ipa` via Xcode Archive |
| Install on phone | `adb install` | Xcode Run / TestFlight |
| Firebase file | `google-services.json` | `GoogleService-Info.plist` |
| Dev + Metro | `npm run dev:android` + adb reverse | Expo dev client + same Wi‑Fi or USB |
| Docs | `docs/mobile/README.md` | **this file** |

---

## Recommended order of work

1. **Tier 1** — bundle ID, prebuild, Xcode signing, run on your iPhone (core app)
2. **Tier 2** — Apple Sign-In + API env (required if keeping Google/Facebook on iOS)
3. **Tier 2** — Google iOS client + code fix
4. **Tier 3** — Firebase iOS + APNs (push banners)
5. **Tier 4** — TestFlight → App Store

---

## Links

- [Expo iOS build](https://docs.expo.dev/build/setup/)
- [Expo prebuild](https://docs.expo.dev/workflow/prebuild/)
- [Sign in with Apple (Expo)](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Push notifications (Expo)](https://docs.expo.dev/push-notifications/overview/)
- Prysym push details: [`../docs/mobile/notifications.md`](../docs/mobile/notifications.md)
- Prysym API / OAuth env: [`../docs/api/api.md`](../docs/api/api.md)

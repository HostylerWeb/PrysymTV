# Android release signing (PrysymTV)

Production APKs/AABs must be signed with the **release keystore**, not the debug keystore.

## Files (local only — never commit)

| File | Purpose |
|------|---------|
| `mobile/android/app/prysymtv-release.keystore` | Release signing key |
| `mobile/android/keystore.properties` | Passwords + alias (see `keystore.properties.example`) |

Back up the keystore and passwords in a password manager. **If you lose the keystore, you cannot update the same Play Store app.**

## After `expo prebuild`

The `android/` folder is regenerated. Re-apply signing:

```bash
bash mobile/scripts/patch-android-release-signing.sh
```

Restore `keystore.properties` and `prysymtv-release.keystore` if they were removed.

## SHA fingerprints for Firebase / Google Sign-In

Get fingerprints from the release keystore:

```bash
keytool -list -v \
  -keystore mobile/android/app/prysymtv-release.keystore \
  -alias prysymtv-release
```

Add **SHA-1** and **SHA-256** in:

1. **Firebase Console** → Project settings → Your apps → Android (`com.prysymtv.android`) → **Add fingerprint**
2. **Google Cloud Console** → APIs & Services → Credentials → Android OAuth client → add SHA-1

Keep the **debug** SHA registered too if you still test debug builds with Google Sign-In.

You do **not** need a new Firebase project or new `google-services.json` when adding fingerprints.

## Play Store (later)

Enable **Google Play App Signing** and also add Play’s **app signing key** SHA fingerprints to Firebase (Play Console → Setup → App signing).

## Build release APK

```bash
cd mobile
pnpm run build:apk:release
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

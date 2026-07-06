# Mobile — SDK reminder

## Current setup (development)

This project intentionally uses **Expo SDK 54** so it works with **Expo Go** from the Play Store / App Store during development.

| Package | Version |
|---------|---------|
| Expo | 54 |
| React Native | 0.81 |

## Before production / Play Store release

**Upgrade to the latest Expo SDK** and align dependencies:

```bash
cd mobile
npx expo install expo@latest
npx expo install --fix
```

Then:

1. Run full QA on a **release build** (not only Expo Go).
2. Build the Android AAB (EAS Build or local `expo run:android` / Gradle).
3. Update this file with the new SDK version.

## Why

- Play Store **Expo Go** lags behind the newest SDK — fine for dev, not for shipping.
- Production builds use **your own app binary**, not Expo Go.
- Newer SDKs include updated React Native, security fixes, and Play Store requirements.

## References

- [Upgrade Expo SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- Project API docs: [`../guides-md-files/api.md`](../guides-md-files/api.md)

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Android Studio (snap) bundles JDK 17+ required by AGP 8+
if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -d /snap/android-studio/current/jbr ]]; then
    export JAVA_HOME=/snap/android-studio/current/jbr
  elif [[ -d "$HOME/android-studio/jbr" ]]; then
    export JAVA_HOME="$HOME/android-studio/jbr"
  fi
fi

if [[ -z "${ANDROID_HOME:-}" ]]; then
  if [[ -d "$HOME/Android/Sdk" ]]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
  fi
fi

if [[ -z "${JAVA_HOME:-}" ]]; then
  echo "JAVA_HOME not set. Install JDK 17+ or set JAVA_HOME to Android Studio's JBR." >&2
  exit 1
fi

if [[ -z "${ANDROID_HOME:-}" ]]; then
  echo "ANDROID_HOME not set. Install Android SDK via Android Studio." >&2
  exit 1
fi

# Release builds must embed the JS bundle (Expo export:embed)
for arg in "$@"; do
  if [[ "$arg" == *Release* ]]; then
    export NODE_ENV=production
    break
  fi
done

cd "$ROOT"
node scripts/generate-notification-icons.js

cd "$ROOT/android"
./gradlew "$@"

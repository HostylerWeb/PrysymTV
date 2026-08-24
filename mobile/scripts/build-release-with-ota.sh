#!/usr/bin/env bash
# Build signed release APK with OTA config embedded (requires bootstrap-xprem.sh first).
set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "${MOBILE_DIR}/.." && pwd)"
SECRETS_FILE="${ROOT_DIR}/infra/ota/bootstrap.secrets.env"

if [[ -f "${SECRETS_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${SECRETS_FILE}"
  set +a
fi

: "${EXPO_OTA_APP_ID:?Run scripts/bootstrap-xprem.sh first}"

export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="${ANDROID_HOME}/platform-tools:${PATH}"

cd "${MOBILE_DIR}"

KEYSTORE_BACKUP="/tmp/prysymtv-keystore-backup"
if [[ -d android/app ]]; then
  rm -rf "${KEYSTORE_BACKUP}"
  mkdir -p "${KEYSTORE_BACKUP}"
  [[ -f android/app/prysymtv-release.keystore ]] && cp android/app/prysymtv-release.keystore "${KEYSTORE_BACKUP}/"
  [[ -f android/keystore.properties ]] && cp android/keystore.properties "${KEYSTORE_BACKUP}/"
fi

if [[ -f google-services.json ]]; then
  mkdir -p android/app
  cp google-services.json android/app/google-services.json
fi

echo "Prebuild with OTA app id ${EXPO_OTA_APP_ID}..."
npx expo prebuild --platform android --clean

if [[ -d "${KEYSTORE_BACKUP}" ]]; then
  [[ -f "${KEYSTORE_BACKUP}/prysymtv-release.keystore" ]] && cp "${KEYSTORE_BACKUP}/prysymtv-release.keystore" android/app/
  [[ -f "${KEYSTORE_BACKUP}/keystore.properties" ]] && cp "${KEYSTORE_BACKUP}/keystore.properties" android/
fi

bash scripts/patch-android-release-signing.sh

if [[ ! -f android/app/prysymtv-release.keystore || ! -f android/keystore.properties ]]; then
  echo "ERROR: Release keystore missing after prebuild. Restore mobile/android/app/prysymtv-release.keystore and android/keystore.properties" >&2
  exit 1
fi

if [[ -f google-services.json ]]; then
  cp google-services.json android/app/google-services.json
fi

echo "Building release APK..."
pnpm run build:apk:release

OUT="${MOBILE_DIR}/android/app/build/outputs/apk/release/app-release.apk"
STAMP="$(date +%Y%m%d)"
mkdir -p "${MOBILE_DIR}/releases"
cp "${OUT}" "${MOBILE_DIR}/releases/prysymtv-android-release-${STAMP}.apk"
echo "APK: ${MOBILE_DIR}/releases/prysymtv-android-release-${STAMP}.apk"
